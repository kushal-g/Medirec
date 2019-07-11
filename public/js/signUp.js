
//Enter animation
$(document).ready(()=>{
    $('.details').slideDown(()=>{
        $('.submit-btn').css('display','inline');
    });
});

//form validation

let today=new Date();
let dd=today.getDate();
let mm=today.getMonth()+1;
let yyyy=today.getFullYear();
if(dd<10){dd='0'+dd};
if(mm<10){mm='0'+mm};
let max_date=`${yyyy}-${mm}-${dd}`;

let namePattern = /^[a-zA-Z]+$/
let socSecPattern =/^[0-9]+$/;
let phoneNoPattern =/^[0-9]{10,10}$/

$('.signup-form').submit(e=>{
    e.preventDefault();
    if(!namePattern.test($('#firstName').val())||!namePattern.test($('#lastName').val()))
    {
        $('.nameWarning').css("display","inline");
    }
    else
    {
        $('.nameWarning').css("display","none");
    }

    if(!namePattern.test($('#nationality').val()))
    {
        $('.nationalityWarning').css("display","inline");
    }
    else
    {
        $('.nationalityWarning').css("display","none");
    }

    if(!socSecPattern.test($('#socSec').val()))
    {
        $('.socSecWarning').css("display","inline");
    }
    else
    {
        $('.socSecWarning').css("display","none");
    }
    
    if($("#maritalStatus").val()=='Marital Status')
    {
        $('.maritalStatusWarning').css("display","inline");
    }
    else
    {
        $('.maritalStatusWarning').css("display","none");
    }
    
    if($("#sex").val()=='Sex')
    {
        $('.sexWarning').css("display","inline");
    }
    else
    {
        $('.sexWarning').css("display","none");
    }
    if(!phoneNoPattern.test($("#phoneNo").val()))
    {   
        $('.phoneNoWarning').css("display","inline");
    }
    else
    {
        $('.phoneNoWarning').css("display","none");
    }
    if($('#dob').val()>max_date)
    {
        $('.dateWarning').css("display","inline");
    }
    else
    {
        $('.dateWarning').css("display","none");
    }

    if(!($('#email').val()==$('#checkEmail').val()))
    {
        $('.emailWarning').css("display","inline");
    }
    else
    {
        $('.emailWarning').css("display","none");
    }

    if(!($('#password').val()==$('#checkPassword').val()))
    {
        $('.passwordWarning').css("display","inline");
    }
    else
    {
        $('.passwordWarning').css("display","none");
    }
});