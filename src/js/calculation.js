function computeMonthAnnuity( amount, rate, months, isRounded )
{
    var monthRate = rate / 12;
    var annuity = amount * ( monthRate / ( 1 - Math.pow( 1 + monthRate, -months ) ) );
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

function createInstalment( amount, annuity, rate, loanStartDate, firstPaymentDate, periodsPercentOnly, er )
{
    var instalment = [];
    var millisInDay = 1000 * 60 * 60 * 24;
    var curAmount = amount;
    var curAnnuity;
    var curPercent;
    var curLoan;
    var curPaymentDate = loanStartDate;
    var curNextPaymentDate = firstPaymentDate;
    //noinspection UnnecessaryLocalVariableJS
    var curNewPaymentDate;
    var curPeriod;
    var curRow;
    var curEr = er.slice();
    var isEr;
    for( var i = 0; curAmount > 0; i++ )
    {
        if( curEr.length > 0 && curEr[0].date.getTime() <= curNextPaymentDate.getTime() )
        {
            isEr = true;
            curNewPaymentDate = curEr[0].date;
        }
        else
        {
            isEr = false;
            curNewPaymentDate = curNextPaymentDate;
        }
        curPeriod = ( curNewPaymentDate.getTime() - curPaymentDate.getTime() ) / millisInDay;
        curPercent = calculatePercent( curAmount, rate, curPeriod );

        if( isEr )
        {
            curAnnuity = curEr[0].sum;
            i--;
        }
        else
        {
            if( i >= periodsPercentOnly )
            {
                curAnnuity = annuity;
            }
            else
            {
                curAnnuity = curPercent;
            }
        }
        curLoan = Math.round( ( curAnnuity - curPercent ) * 100 ) / 100;
        if( curAmount - curLoan < 0 )
        {
            curLoan = curAmount;
        }
        curAmount = Math.round( ( curAmount - curLoan ) * 100 ) / 100;

        curRow =
        {
            row: isEr ? '-' : i + 1,
            date: new Date( curNewPaymentDate.getTime() ),
            annuity: curPercent + curLoan,
            percent: curPercent,
            loan: curLoan,
            remainLoan: curAmount
        };
        instalment.push( curRow );

        curPaymentDate = new Date( curNewPaymentDate.getTime() );
        if( isEr )
        {
            curEr.splice( 0, 1 );
        }
        else
        {
            curNextPaymentDate.setMonth( curNextPaymentDate.getMonth() + 1 );
        }
    }

    if( curAmount > 0 )
    {
        curPeriod = ( curNewPaymentDate.getTime() - curPaymentDate.getTime() ) / millisInDay;
        curPercent = calculatePercent( curAmount, rate, curPeriod );
        curLoan = curAmount;
        curAmount = curAmount - curLoan;

        curRow =
        {
            row: i + 1,
            date: new Date( curNewPaymentDate.getTime() ),
            annuity: curPercent + curLoan,
            percent: curPercent,
            loan: curLoan,
            remainLoan: curAmount
        };
        instalment.push( curRow );
    }

    return instalment;
}

//    Calculate percent for curAmount with rate as annual year rate and period in days
function calculatePercent( amount, rate, period )
{
    return Math.round( amount * period * rate / 365 * 100 ) / 100;
}
