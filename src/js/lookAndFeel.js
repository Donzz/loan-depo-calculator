function getNormalDate( dateStr )
{
    var dateNormal = dateStr.split( '.' );
    //noinspection UnnecessaryLocalVariableJS
    var dateOut = new Date( dateNormal[2], dateNormal[1] - 1, dateNormal[0] );
    return dateOut;
}

function getFormattedDate( date )
{
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return day + '.' + month + '.' + year;
}

function getFormattedSum( sum, fractionalNumbers = 2, needFractional = true )
{
    var result;
    var sumStr = sum.toString();
    var integer;
    if( sumStr.indexOf( '.' ) == -1 )
    {
        integer = sumStr;
        sumStr = sumStr + '.';
    }
    else if( sumStr.indexOf( '.' ) == 0 )
    {
        integer = '0';
    }
    else
    {
        integer = sumStr.substring( 0, sumStr.indexOf( '.' ) );
    }
    needFractional = sum - integer === 0 ? needFractional : true;
    integer = addThousandSpaces( integer );
    var fract = sumStr.substring( sumStr.indexOf( '.' ) + 1 );
    while( fract.length < fractionalNumbers )
    {
        fract += '0';
    }
    fract = fract.substring( 0, fractionalNumbers );
    result = integer + ( needFractional ? ( '.' + fract ) : '' );
    return result;
}

function addThousandSpaces( integer )
{
    var result = integer + '';
    var rgx = /(\d+)(\d{3})/;
    while( rgx.test( result ) )
    {
        result = result.replace( rgx, '$1' + ' ' + '$2' );
    }
    return result;
}

function setPaymentStartDate()
{
    var firstPaymentDate = getNormalDate( document.getElementById( "loanStartDate" ).value );
    firstPaymentDate.setMonth( firstPaymentDate.getMonth() + 1 );
    document.getElementById( "firstPaymentDate" ).value = getFormattedDate( firstPaymentDate );
    $( '#dpfirstPaymentDate' ).datepicker( 'update', getFormattedDate( firstPaymentDate ) );
}

function computeAndShow()
{
    var amount = document.getElementById( "amount" ).value.replace( / /g, '' );
    var rate = document.getElementById( "rate" ).value;
    if( rate.indexOf( "," ) != -1 )
    {
        rate = rate.replace( ",", "." );
    }
    var months = document.getElementById( "months" ).value;
    var normalRate = rate > 1 ? rate / 100 : rate;

    var loanStartDate = getNormalDate( document.getElementById( "loanStartDate" ).value );
    var firstPaymentDate = getNormalDate( document.getElementById( "firstPaymentDate" ).value );

//    var isRounded = document.getElementById( "isRoundedAnnuity" ).checked;
    var isRounded = false;
    var periodsPercentOnly = document.getElementById( "periodsPercentOnly" ).value;
    var annuity = computeMonthAnnuity( amount, normalRate, months, isRounded );

    document.getElementById( "annuity" ).innerHTML = "\<b>Аннуитетный платеж: \</b>" + getFormattedSum( annuity );
    var instalment = createInstalment( amount, annuity, normalRate, loanStartDate, firstPaymentDate, periodsPercentOnly );

    var table = document.getElementById( "instalmentTable" );
    var tBodies = table.tBodies;
    for( var j = 0; j < tBodies.length; j++ )
    {
        table.removeChild( tBodies[0] );
    }
    var tbody = document.createElement( "tbody" );
    table.appendChild( tbody );
    var tr;
    var row;
    var overpayment = 0;

    var pskData = [
        {
            Date: loanStartDate,
            Flow: amount
        }
    ];

    for( var i = 0; i < instalment.length; i++ )
    {
        tr = document.createElement( "tr" );

        row = instalment[i];
        tr.insertCell( 0 ).appendChild( document.createTextNode( row.row ) );
        tr.insertCell( 1 ).appendChild( document.createTextNode( getFormattedDate( row.date ) ) );
        tr.insertCell( 2 ).appendChild( document.createTextNode( getFormattedSum( row.annuity ) ) );
        tr.insertCell( 3 ).appendChild( document.createTextNode( getFormattedSum( row.percent ) ) );
        tr.insertCell( 4 ).appendChild( document.createTextNode( getFormattedSum( row.loan ) ) );
        tr.insertCell( 5 ).appendChild( document.createTextNode( getFormattedSum( row.remainLoan ) ) );
        tbody.appendChild( tr );

        overpayment += row.annuity;
        pskData.push( {
            Date: row.date,
            Flow: row.annuity
        } );
    }

    overpayment -= amount;
    document.getElementById( "overpayment" ).innerHTML = "\<b>Переплата: \</b>" + getFormattedSum( overpayment );

    var fullCreditCost = psk( pskData, 30 );
    document.getElementById( "fullCreditCost" ).innerHTML = "\<b>ПСК: \</b>" + getFormattedSum( fullCreditCost, 3 ) + "%";

    createDirectLink();
}

function createDirectLink()
{
    var url = window.location.href;
    if( url.indexOf( '?' ) > 0 )
    {
        url = url.substring( 0, url.indexOf( '?' ) );
    }
    url = url + '?';
    var inputs = document.getElementsByTagName( "input" );
    for( var i = 0; i < inputs.length; i++ )
    {
        if( inputs[i].type != "button" && inputs[i].id.indexOf( "Ex" ) === -1 )
        {
            var v;
            if( inputs[i].type === "checkbox" )
            {
                v = inputs[i].checked;
            }
            else
            {
                v = inputs[i].value;
            }
            url = url + inputs[i].id + "=" + v + "&";
        }
    }
    url = url.substr( 0, url.length - 1 );
    document.getElementById( "directLinkEx" ).value = url;
}

function setGetParameters()
{
    var params = getSearchParameters();
    var isSet = false;
    for( var p in params )
    {
        if( params.hasOwnProperty( p ) )
        {
            var e = document.getElementById( p );
            e.value = decodeURIComponent( params[p] );
            e.checked = params[p] === "true";
            if( p.indexOf( "Date" ) >= 0 )
            {
                var dateStr = getNormalDate( e.value );
                var dateControl = $( "#dp" + p );
                dateControl.datepicker( {
                    autoclose: true,
                    language: "ru",
                    weekStart: 1
                } );
                dateControl.datepicker( 'update', getFormattedDate( dateStr ) );
            }
            isSet = true;
        }
    }
    if( isSet )
    {
        computeAndShow();
    }

}

function getSearchParameters()
{
    var prmstr = window.location.search.substr( 1 );
    return prmstr != null && prmstr != "" ? transformToAssocArray( prmstr ) : {};
}

function transformToAssocArray( prmstr )
{
    var params = {};
    var prmarr = prmstr.split( "&" );
    for( var i = 0; i < prmarr.length; i++ )
    {
        var tmparr = prmarr[i].split( "=" );
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}

function addEarlyRepaymentControls()
{
    var tbodyEP = document.getElementById( "erDyn" );
    var rowsAmount = tbodyEP.childNodes.length;
    var tr = document.createElement( "tr" );
    var d = createERDiv();

    var e = document.createElement( "input" );
    e.id = "erSumDyn" + ( rowsAmount + 1 );
    e.type = "text";
    e.class = "form-control";
    e.placeholder = "Сумма к погашению";
    e.onblur = function()
    {
        document.getElementById( e.id ).value = getFormattedSum( document.getElementById( e.id ).value.replace( / /g, '' ), 0, false );
    };

    d.appendChild( e );
    tr.insertCell( 0 ).appendChild( d );
    d.class = "col-lg-1";

//    tr.insertCell( 1 ).appendChild( document.createTextNode( getFormattedDate( row.date ) ) );

    tbodyEP.appendChild( tr );

//    <input id="amount" type="text" value="3 000 000" class="form-control"
//               onblur="document.getElementById('amount').value = getFormattedSum(document.getElementById('amount').value.replace( / /g, '' ), 0, false)"/>

}

function createERDiv()
{
    var d = document.createElement( "div" );
    d.class = "col-lg-1";
    return d;
}

