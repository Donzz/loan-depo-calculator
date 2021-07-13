//Created by Kirill Danilov
//2017
//Contact the author if want to use

var amount;
var rate;
var normalRate;
var interestReduceSumPercent;
var interestReduceSum;
var insuranceSum;
var loanStartDate;
var firstPaymentDate;
var check = false;

function getNormalDate( dateStr )
{
    var dateNormal = dateStr.split( '.' );
    //noinspection UnnecessaryLocalVariableJS
    var dateOut = new Date( dateNormal[2], dateNormal[1] - 1, dateNormal[0] );
    return dateOut;
}

function getNormalSum( sumStr )
{
    return parseFloat( sumStr.replace( / /g, '' ).replace( ',', '.' ) );
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

function getFormattedSum( sum, fractionalNumbers )
{
    var result;
    if( typeof fractionalNumbers === "undefined" )
    {
        fractionalNumbers = 2;
    }
    var sumNormal = getNormalSum( '' + sum );
    if( isNaN( sumNormal ) )
    {
        sumNormal = 0;
    }
    var sumStr = sumNormal.toString();
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
    if( sumNormal - integer === 0 )
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
    var divider = Math.pow( 10, fract.length - fractionalNumbers );
    if( divider > 1 )
    {
        fract = '' + Math.round( parseInt( fract ) / divider );
    }
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
//    $( '#dpfirstPaymentDate' ).datetimepicker( 'update', getFormattedDate( firstPaymentDate ) );
}

function computeAndShowCredit()
{
    readControls();
    var months = getNormalSum( document.getElementById( "months" ).value );
    calculateInsurance();
    amount += insuranceSum;
    var annuity = calculateMonthAnnuity( amount, normalRate, months, false );

    document.getElementById( "annuity" ).innerHTML = "\<b>Аннуитетный платеж: \</b>" + getFormattedSum( annuity );

    computeAndShowCommon( annuity, months );
}

function calculateInsurance()
{
    var percentLimit = 99;

    var insurancePercent = getNormalSum( readControlValueSafe( "insurance", "0" ) );
    if( insurancePercent > percentLimit )
    {
        insuranceSum = insurancePercent;
    }
    else
    {
        insuranceSum = calculatePercent( amount, insurancePercent / 100 );
    }

    if( interestReduceSumPercent > percentLimit )
    {
        interestReduceSum = interestReduceSumPercent;
    }
    else
    {
        interestReduceSum = calculatePercent( amount, interestReduceSumPercent / 100 );
    }

}

function computeAndShowCard()
{
    readControls();
    var months = 0;
    var annuity = getNormalSum( document.getElementById( "minPayment" ).value );
    calculateInsurance();
    amount += insuranceSum;
    var minRealPayment = calculatePercentForDates( amount, normalRate, loanStartDate, firstPaymentDate );
    if( annuity < minRealPayment )
    {
        annuity = minRealPayment;
        document.getElementById( "minPayment" ).value = getFormattedSum( annuity );
    }

    var instalment = computeAndShowCommon( annuity, months );

    document.getElementById( "months" ).innerHTML = "\<b>Кол-во платежей: \</b>" + getFormattedSum( instalment[instalment.length - 1].row, 0 );

}

function readControls()
{
    amount = getNormalSum( document.getElementById( "amount" ).value );

    rate = getNormalSum( document.getElementById( "rate" ).value );
    normalRate = getNormalRate(rate);

    interestReduceSumPercent = getNormalSum( readControlValueSafe( "interestReduceSumPercent", "0" ) );

    loanStartDate = getNormalDate( document.getElementById( "loanStartDate" ).value );
    firstPaymentDate = getNormalDate( document.getElementById( "firstPaymentDate" ).value );
}

function readControlValueSafe( idControl, defaultValue )
{
    var result = defaultValue;
    var control = document.getElementById( idControl );
    if( control != null && control.value != '' )
    {
        result = control.value;
    }
    return result;
}

function getNormalRate(locRate)
{
    var locNormalRate = locRate / 100;
    var interestReduceDiff = getNormalSum( readControlValueSafe( "interestReduceDiff", "0" ) );
    //noinspection UnnecessaryLocalVariableJS
    var normalInterestReduceDiff = interestReduceDiff / 100;
    locNormalRate -= normalInterestReduceDiff;
    return locNormalRate;
}

function computeAndShowCommon( annuity, months )
{
//    var isRounded = document.getElementById( "isRoundedAnnuity" ).checked;
    //noinspection JSUnusedLocalSymbols
    var isRounded = false;
    var periodsPercentOnly = getNormalSum( readControlValueSafe( "periodsPercentOnly", "0" ) );

    var isErDuration = true;
    if( document.getElementById( "erAnnuityRadio" ) != null )
    {
        isErDuration = !document.getElementById( "erAnnuityRadio" ).checked;
    }

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

    var instalment = createInstalment( amount, annuity, normalRate, loanStartDate, firstPaymentDate, periodsPercentOnly, er, isErDuration, months );

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
            date: loanStartDate,
            flow: -amount
        }
    ];

    if( insuranceSum > 0 )
    {
        pskData.push( {
            date: loanStartDate,
            flow: insuranceSum
        } );
    }

    if( interestReduceSum > 0 )
    {
        pskData.push( {
            date: loanStartDate,
            flow: interestReduceSum
        } );
    }

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
            date: row.date,
            flow: row.annuity
        } );
    }

    overpayment = overpayment - amount + insuranceSum + interestReduceSum;
    document.getElementById( "overpayment" ).innerHTML = "\<b>Переплата: \</b>" + getFormattedSum( overpayment );

    var fullCreditCost = calcEffectivePercent( pskData, 30 );
    if( check )
    {
        var pskSum = checkPSK( fullCreditCost, pskData, 30 );
        document.getElementById( "fullCreditCost" ).innerHTML = "\<b>ПСК: \</b>" + getFormattedSum( fullCreditCost, 3 ) + "%" + " Checked sum: " + getFormattedSum( pskSum, 4 );
    }
    else
    {
        document.getElementById( "fullCreditCost" ).innerHTML = "\<b>ПСК: \</b>" + getFormattedSum( fullCreditCost, 3 ) + "%";
    }

    createDirectLink();

    return instalment;
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
            if( inputs[i].type === "checkbox" || inputs[i].type === "radio" )
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
    document.getElementById( "directLinkEx" ).value = encodeURI(url);
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
            if( e != null )
            {
                e.value = decodeURIComponent( params[p] );
                e.checked = params[p] === "true";
                if( p.indexOf( "Date" ) >= 0 )
                {
                    var dateStr = getNormalDate( e.value );
                    var dateControl = $( "#dp" + p );
                    dateControl.datetimepicker( {
                        locale: 'ru',
                        format: 'DD.MM.YYYY'
                    } );
                    dateControl.value = getFormattedDate( dateStr );
                }
                isSet = true;
            }
            if( p == "check" )
            {
                check = true;
            }
        }
    }
    if( isSet )
    {
        computeAndShowCredit();
    }
    else
    {
        document.getElementById( "loanStartDate" ).value = getFormattedDate(new Date());
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
    var tbodyEr = document.getElementById( "dynEr" );
    var rowNumber = tbodyEr.childNodes.length;
    var tr = document.createElement( "tr" );
    tr.id = "dynErTr" + rowNumber;

    var e = $( "#amountDiv" ).clone();
    var eNode = e.get( 0 );
    var amountNode = eNode.childNodes.item( 3 ).childNodes.item( 1 );
    amountNode.id = "dynErSum" + rowNumber;
    amountNode.value = "";
    amountNode.placeholder = "Сумма к погашению";
    amountNode.onblur = function()
    {
        document.getElementById( amountNode.id ).value = getFormattedSum( document.getElementById( amountNode.id ).value.replace( / /g, '' ), 0 );
    };

    tr.insertCell( 0 ).appendChild( amountNode );

    var e2 = $( "#dpfirstPaymentDate" ).clone();
    var e2Node = e2.get( 0 );
    e2Node.id = "dpdynErDate" + rowNumber;
    e2Node.placeholder = "Дата";
    e2Node.childNodes.item( 1 ).id = "dynErDate" + ( rowNumber );

    e2.datetimepicker( {
        locale: 'ru',
        format: 'DD.MM.YYYY'
    } );

    tr.insertCell( 1 ).appendChild( e2Node );

    var eButton =  document.createElement( "button" );
    eButton.id = "deleteEr" + rowNumber;
    eButton.onclick = function() { deleteEarlyRepaymentControls( eButton.id ) };
    var eSpan = document.createElement( "span" );
    eSpan.className = "glyphicon glyphicon-remove-circle";
    eButton.appendChild( eSpan );

    tr.insertCell( 2 ).appendChild( eButton );

    tbodyEr.appendChild( tr );
}

function deleteEarlyRepaymentControls( buttonId )
{
    var rowNumber = parseInt( buttonId.substr( "deleteEr".length ) );
    var tbodyEr = document.getElementById( "dynEr" );

    tbodyEr.removeChild( document.getElementById( "dynErTr" + rowNumber ) );

    for( var erI = rowNumber + 1; ; erI++ )
    {
        var erElSum = document.getElementById( "dynErSum" + erI );
        if( !erElSum )
        {
            break;
        }
        erElSum.id = "dynErSum" + ( erI - 1 );
        document.getElementById( "dpdynErDate" + erI ).id = "dpdynErDate" + ( erI - 1 );
        document.getElementById( "dynErDate" + erI ).id = "dynErDate" + ( erI - 1 );
        document.getElementById( "dynErTr" + erI ).id = "dynErTr" + ( erI - 1 );
        document.getElementById( "deleteEr" + erI ).id = "deleteEr" + ( erI - 1 );
    }
}

function copyDirectLink()
{
    document.getElementById( "directLinkEx" ).select();
    document.execCommand( 'copy' );
}
