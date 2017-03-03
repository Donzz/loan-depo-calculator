function calculateMonthAnnuity( amount, rate, months, isRounded )
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

function createInstalment( amount, annuity, rate, loanStartDate, firstPaymentDate, periodsPercentOnly, er, isErDuration, months )
{
    var instalment = [];
    var millisInDay = 1000 * 60 * 60 * 24;
    var curAmount = amount;
    var curAnnuity = annuity;
    var curPayment;
    var curPercent;
    var curLoan;
    var lastPaymentDate = new Date( loanStartDate.getTime() );
    var nextPaymentDate = new Date( firstPaymentDate.getTime() );
    var curPaymentDate;
    var curPeriod;
    var curRow;
    var rowNumber;
    var curEr = er.slice();
    var isEr;
    for( var i = 1; curAmount > 0; i++ )
    {
        if( curEr.length > 0 && curEr[0].date.getTime() <= nextPaymentDate.getTime() )
        {
            isEr = true;
            curPaymentDate = curEr[0].date;
        }
        else
        {
            isEr = false;
            curPaymentDate = nextPaymentDate;
        }
        curPeriod = ( curPaymentDate.getTime() - lastPaymentDate.getTime() ) / millisInDay;
        curPercent = calculatePercent( curAmount, rate, curPeriod );

        if( isEr )
        {
            if( curEr[0].date.getTime() === nextPaymentDate.getTime() )
            {
                curPayment = curAnnuity + curEr[0].sum;
                rowNumber = i;
            }
            else
            {
                curPayment = curEr[0].sum;
                i--;
                rowNumber = '-';
            }
        }
        else
        {
            if( i > periodsPercentOnly )
            {
                if( i - periodsPercentOnly === months )
                {
                    curPayment = curAmount + curPercent;
                }
                else
                {
                    curPayment = curAnnuity;
                }
            }
            else
            {
                curPayment = curPercent;
            }
            rowNumber = i;
        }
        curLoan = Math.round( ( curPayment - curPercent ) * 100 ) / 100;
        if( curAmount - curLoan < 0 )
        {
            curLoan = curAmount;
        }
        curAmount = Math.round( ( curAmount - curLoan ) * 100 ) / 100;

        curRow =
        {
            row: rowNumber,
            date: new Date( curPaymentDate.getTime() ),
            annuity: Math.round( ( curLoan + curPercent ) * 100 ) / 100,
            percent: curPercent,
            loan: curLoan,
            remainLoan: curAmount
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
                curAnnuity = calculateMonthAnnuity( curAmount, rate, months - i - 1, false );
            }
            curEr.splice( 0, 1 );
        }
    }

    return instalment;
}

//    Calculate percent for curAmount with rate as annual year rate and period in days
function calculatePercent( amount, rate, period )
{
    return Math.round( amount * period * rate / 365 * 100 ) / 100;
}
