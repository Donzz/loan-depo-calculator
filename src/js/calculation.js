//Created by Kirill Danilov
//2017
//Contact the author if want to use

function calculateMonthAnnuity( amount, rate, months, isRounded )
{
    var monthRate = rate / 12;
    var annuity;
    if( monthRate > 0 )
    {
        annuity = amount * ( monthRate / ( 1 - Math.pow( 1 + monthRate, -months ) ) );
    }
    else
    {
        annuity = amount / months;
    }
    if( isRounded )
    {
        annuity = Math.round( annuity );
    }
    else
    {
        annuity = Math.round( annuity * 100 ) / 100;
    }
    return annuity;
}

function createInstalment( amount, annuity, rate, loanStartDate, firstPaymentDate, periodsPercentOnly, er, isErDuration, months )
{
    var instalment = [];
    var curAmount = amount;
    var curAnnuity = annuity;
    var curPayment;
    var curPercent;
    var curLoan;
    var lastPaymentDate = new Date( loanStartDate.getTime() );
    var nextPaymentDate = new Date( firstPaymentDate.getTime() );
    var curPaymentDate;
    var curRow;
    var rowNumber;
    var curEr = er.slice();
    var isEr;
    for( var i = 1; curAmount > 0; i++ )
    {
        curPayment = 0;
        isEr = false;
        curPaymentDate = nextPaymentDate;
        if( curEr.length > 0 && curEr[0].date.getTime() <= curPaymentDate.getTime() )
        {
            isEr = true;
            curPaymentDate = curEr[0].date;
            curPayment += curEr[0].sum;
        }
        curPercent = calculatePercentForDates( curAmount, rate, lastPaymentDate, curPaymentDate );

        if( curPercent > curAnnuity )
        {
            //for credits with long duration it can happens because of different amount of days in months
            curPercent = curAnnuity;
        }

        if( curPaymentDate.getTime() === nextPaymentDate.getTime() )
        {
            if( i > periodsPercentOnly )
            {
                if( i - periodsPercentOnly === months )
                {
                    curPayment += curAmount + curPercent;
                }
                else
                {
                    curPayment += curAnnuity;
                }
            }
            else
            {
                curPayment += curPercent;
            }
            rowNumber = i;
        }
        else
        {
            i--;
            rowNumber = '-';
        }
        curLoan = Math.round( ( curPayment - curPercent ) * 100 ) / 100;
        if( curAmount - curLoan < 0 )
        {
            curLoan = curAmount;
        }
        curAmount = Math.round( ( curAmount - curLoan ) * 100 ) / 100;

        var paidAnnuity = Math.round( ( curLoan + curPercent ) * 100 ) / 100;

        curRow =
        {
            row: rowNumber,
            date: new Date( curPaymentDate.getTime() ),
            annuity: paidAnnuity,
            percent: curPercent,
            loan: curLoan,
            remainLoan: curAmount,
            overpaymentTimed: curPercent / Math.pow( 1 + rate / 12, i ),
            paymentTimed: paidAnnuity / Math.pow( 1 + rate / 12, i )
        };
        instalment.push( curRow );

        lastPaymentDate = new Date( curPaymentDate.getTime() );
        if( !isEr || curEr[0].date.getTime() == nextPaymentDate.getTime() )
        {
            nextPaymentDate.setMonth( nextPaymentDate.getMonth() + 1 );
        }
        if( isEr )
        {
            if( !isErDuration )
            {
                var corrected;
                if( i >= periodsPercentOnly )
                {
                    corrected = periodsPercentOnly;
                }
                else
                {
                    corrected = i;
                }
                curAnnuity = calculateMonthAnnuity( curAmount, rate, months - i + corrected, false );
            }
            curEr.splice( 0, 1 );
        }
    }

    return instalment;
}

//    Calculate percent for curAmount with rate as annual year rate and period in days
//noinspection JSUnusedGlobalSymbols
function calculatePercentForPeriod( amount, rate, period, isLeapYear )
{
    var daysInYear = isLeapYear ? 366 : 365;
    return Math.round( calculatePercent( amount, rate ) * period * 100 / daysInYear ) / 100;
}

//    Calculate percent for curAmount with rate as annual year rate and period between two dates
function calculatePercentForDates( amount, rate, firstDate, lastDate )
{
    const millisInDay = 1000 * 60 * 60 * 24;
    var firstYear = firstDate.getFullYear();
    var lastYear = lastDate.getFullYear();
    if( firstYear == lastYear || (!isLeapYear(firstYear) && !isLeapYear(lastYear)))
    {
        var period = ( lastDate.getTime() - firstDate.getTime() ) / millisInDay;
        return calculatePercentForPeriod( amount, rate, period, isLeapYear(firstYear) );
    }
    else
    {
        const firstDateLastYear = new Date(lastYear, 0, 1 );
        var firstPeriod = ( firstDateLastYear.getTime() - firstDate.getTime() ) / millisInDay;
        var lastPeriod = ( lastDate.getTime() - firstDateLastYear.getTime() ) / millisInDay;
        return calculatePercentForPeriod( amount, rate, firstPeriod, isLeapYear(firstYear) )
            + calculatePercentForPeriod( amount, rate, lastPeriod, isLeapYear(lastYear) );
    }

}

function calculatePercent( amount, rate )
{
    return Math.round( amount * rate * 100 ) / 100;
}

function isLeapYear( year )
{
    return year % 4 == 0;
}