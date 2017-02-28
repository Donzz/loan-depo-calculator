function getNormalDate( dateStr )
{
    var dateNormal = dateStr.split( '.' );
    //noinspection UnnecessaryLocalVariableJS
    var dateOut = new Date( dateNormal[2], dateNormal[1] - 1, dateNormal[0] );
    return dateOut;
}

function getNormalSum( sumStr )
{
    return sumStr.replace( / /g, '' );
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

function getFormattedSum( sum, fractionalNumbers = 2 )
{
    var result;
    var sumStr = sum.toString();
    if( sumStr.length == 0 )
    {
        sumStr = '0';
    }
    var integer;
    var fractDot = sumStr.indexOf( '.' );
    if( fractDot == -1 )
    {
        integer = sumStr;
        sumStr = sumStr + '.';
        fractDot = sumStr.indexOf( '.' );
    }
    else if( fractDot == 0 )
    {
        integer = '0';
    }
    else
    {
        integer = sumStr.substring( 0, fractDot );
    }

    for( var zeroI = 0; zeroI < integer.length - 1; zeroI++ )
    {
        if( integer.substr( zeroI, 1 ) != '0' )
        {
            break;
        }
    }

    integer = integer.substring( zeroI );

    var needFractional;
    if( sum - integer === 0 )
    {
        needFractional = fractionalNumbers != 0;
    }
    else
    {
        needFractional = true;
        fractionalNumbers = fractionalNumbers === 0 ? sumStr.substring( fractDot + 1 ).length : fractionalNumbers;
    }

    integer = addThousandSpaces( integer );
    var fract = sumStr.substring( fractDot + 1 );
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
    var amount = getNormalSum( document.getElementById( "amount" ).value );
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

    var er = [];
    for( var erI = 1; ; erI++ )
    {
        var erElSum = document.getElementById( "dynErSum" + erI );
        if( !erElSum )
        {
            break;
        }
        if( erElSum.value.length > 0 && erElSum.value != '0' )
        {
            er.push( {
                sum: getNormalSum( erElSum.value ),
                date: getNormalDate( document.getElementById( "dynErDate" + erI ).value )
            } );
        }
    }
    er.sort( function( a, b )
    {
        return a.date.getTime() - b.date.getTime();
    } );

    var annuity = computeMonthAnnuity( amount, normalRate, months, isRounded );

    document.getElementById( "annuity" ).innerHTML = "\<b>Аннуитетный платеж: \</b>" + getFormattedSum( annuity );
    var instalment = createInstalment( amount, annuity, normalRate, loanStartDate, firstPaymentDate, periodsPercentOnly, er );

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
            if( !e && p.indexOf( "dynEr" ) >= 0 )
            {
                addEarlyRepaymentControls();
                e = document.getElementById( p );
            }
            if( !e )
            {
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
    var rowNumber = tbodyEP.childNodes.length;
    var tr = document.createElement( "tr" );

    var e = document.getElementById( "amount" ).cloneNode( true );
    e.id = "dynErSum" + ( rowNumber );
    e.value = "";
    e.placeholder = "Сумма к погашению";
    e.onblur = function()
    {
        document.getElementById( e.id ).value = getFormattedSum( document.getElementById( e.id ).value.replace( / /g, '' ), 0 );
    };

    tr.insertCell( 0 ).appendChild( e );

    var e2 = $( "#dpfirstPaymentDate" ).clone();
    var e2Node = e2.get( 0 );
    e2Node.id = "dpdynErDate" + ( rowNumber );
    e2Node.placeholder = "Дата";
    e2Node.childNodes.item( 1 ).id = "dynErDate" + ( rowNumber );

    e2.datepicker( {
        autoclose: true,
        language: "ru",
        weekStart: 1
    } );

    tr.insertCell( 1 ).appendChild( e2Node );

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

