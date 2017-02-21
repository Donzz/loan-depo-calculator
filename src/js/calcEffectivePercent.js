function psk(values, bp){
    values[0].Flow *= -1;

    var x0 = 0;
    var x1 = 0.0;
    var err = 1000000000000;
    var tol = 0.00001;

    var f_x = function (p, dt, dt0, x) {
        var pow = Math.floor(((dt - dt0) / (24 * 60 * 60 * 1000)) / bp);
        var ek = (((dt - dt0) / (24 * 60 * 60 * 1000)) % bp) / bp;
        return p / ((1.0 + ek * x) * Math.pow((1.0 + x), pow));
    };

    var df_x = function (p, dt, dt0, x) {
        var pow = Math.floor(((dt - dt0) / (24 * 60 * 60 * 1000)) / bp);
        var ek = (((dt - dt0) / (24 * 60 * 60 * 1000)) % bp) / bp;
        var r = p * (1.0 / Math.pow(1.0 + x, pow)) * (-ek / Math.pow(1.0 + ek * x, 2)) + p * (1.0 / (1.0 + ek * x)) * (-pow / Math.pow(1.0 + x, pow + 1.0));
        return r;
    };

    var total_f_x = function (values, x) {
        var resf = 0.0;
        for (var i = 0; i < values.length; i++) {
            var r = f_x(values[i].Flow, values[i].Date, values[0].Date, x);
            resf = resf + r;
        }
        return resf;
    };

    var total_df_x = function (values, x) {
        var resf = 0.0;
        for (var i = 0; i < values.length; i++) {
            var r = df_x(values[i].Flow, values[i].Date, values[0].Date, x);
            resf = resf + r;
        }
        return resf;
    };

    while (err > tol) {
        x1 = x0 - total_f_x(values, x0) / total_df_x(values, x0);
        err = Math.abs(x1 - x0);
        x0 = x1;
    }

    var cbp = 365 / bp;

    //считаем ПСК
    var psk = (x0 * cbp * 100 * 1000) / 1000;

    //выводим ПСК
    return psk;
}

function calcEffectivePercent(pskData)
{
    //входящие данные - даты платежей
    var dates = pskData['dates'];
    //входящие данные - суммы платежей
    var sums = pskData['sums'];
    var m = dates.length; // число платежей

    //Задаем базвый период bp
    bp = 31;
    //Считаем число базовых периодов в году:
    var cbp = Math.round(365 / bp);

    //заполним массив с количеством дней с даты выдачи до даты к-го платежа
    var days = [];
    for(k = 0; k < m; k++)
    {
        days[k] = (dates[k] - dates[0]) / (24 * 60 * 60 * 1000);
    }

    //посчитаем Ек и Qк для каждого платежа
    var e = [];
    var q = [];
    for(k = 0; k < m; k++)
    {
        e[k] = (days[k] % bp) / bp;

        q[k] = Math.floor(days[k] / bp);

    }

    //Методом перебора начиная с 0 ищем i до максимального приближения с шагом s
    var i = 0;
    var x = 1;
    var x_m = 0;
    var s = 0.000001;
    while(x > 0)
    {
        x_m = x;
        x = 0;
        for(k = 0; k < m; k++)
        {
            x = x + sums[k] / ((1 + e[k] * i) * Math.pow(1 + i, q[k]));
        }
        i = i + s;
    }
    if(x > x_m)
    {
        i = i - s;
    }

    //считаем ПСК
    var psk = Math.floor(i * cbp * 100 * 1000) / 1000;
    return psk;
}