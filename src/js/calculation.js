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

function createInstalment( amount, annuity, rate, loanStartDate, firstPaymentDate, periodsPercentOnly )
{
    var instalment = [];
    var millisInDay = 1000 * 60 * 60 * 24;
    var curAmount = amount;
    var curPercent;
    var curLoan;
    var curPaymentDate = loanStartDate;
    //noinspection UnnecessaryLocalVariableJS
    var curNewPaymentDate = firstPaymentDate;
    var curPeriod;
    var curRow;
    for( var i = 0; curAmount > 0; i++ )
    {
        curPeriod = ( curNewPaymentDate.getTime() - curPaymentDate.getTime() ) / millisInDay;
        curPercent = calculatePercent( curAmount, rate, curPeriod );

        if( i >= periodsPercentOnly )
        {
            curLoan = Math.round( ( annuity - curPercent ) * 100 ) / 100;
        }
        else
        {
            curLoan = 0;
        }
        if( curAmount - curLoan < 0 )
        {
            curLoan = curAmount;
        }
        curAmount = Math.round( ( curAmount - curLoan ) * 100 ) / 100;

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

        curPaymentDate = new Date( curNewPaymentDate.getTime() );
        curNewPaymentDate.setMonth( curNewPaymentDate.getMonth() + 1 );
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
