function calcEffectivePercent( pskData, daysInPeriod )
{
    //входящие данные - даты платежей
    var dates = [];
    //входящие данные - суммы платежей
    var sums = [];
    for( var d in pskData )
    {
        dates.push( pskData[d].date );
        sums.push( pskData[d].flow );
    }
    var m = dates.length; // число платежей

    //Задаем базвый период bp
    var bp = daysInPeriod;
    //Считаем число базовых периодов в году:
    var cbp = Math.floor( 365 / bp );

    //заполним массив с количеством дней с даты выдачи до даты к-го платежа
    var days = [];
    for( k = 0; k < m; k++ )
    {
        days[k] = (dates[k] - dates[0]) / (24 * 60 * 60 * 1000);
    }

    //посчитаем Ек и Qк для каждого платежа
    var e = [];
    var q = [];
    for( k = 0; k < m; k++ )
    {
        e[k] = (days[k] % bp) / bp;

        q[k] = Math.floor( days[k] / bp );

    }

    //Методом перебора начиная с 0 ищем i до максимального приближения с шагом s
    var i = 0;
    var x = 1;
    var x_m = 0;
    var s = 0.000001;
    while( x > 0 )
    {
        x_m = x;
        x = 0;
        for( k = 0; k < m; k++ )
        {
            x = x + sums[k] / ((1 + e[k] * i) * Math.pow( 1 + i, q[k] ));
        }
        i = i + s;
    }
    if( x > x_m )
    {
        i = i - s;
    }

    //считаем ПСК
    var psk = Math.floor( i * cbp * 100 * 1000 ) / 1000;
    return psk;
}