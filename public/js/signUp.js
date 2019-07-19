
//Enter animation
$(document).ready(()=>{
    $('.details').slideDown(()=>{
        $('.submit-btn').css('display','inline');
    });
});

//form validation
const valid=()=>{

    let valid=true;

    if(!validator.isAlpha($('#firstName').val())||!validator.isAlpha($('#lastName').val()))
    {
        $('.nameWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.nameWarning').css("display","none");
    }

    if(!validator.isAlpha($('#nationality').val()))
    {
        $('.nationalityWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.nationalityWarning').css("display","none");
    }

    if(!validator.isNumeric($('#socSec').val(),{no_symbols: true}))
    {
        $('.socSecWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.socSecWarning').css("display","none");
    }
    
    if(validator.equals($('#maritalStatus').val(),'Marital Status'))
    {
        $('.maritalStatusWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.maritalStatusWarning').css("display","none");
    }
    
    if(validator.equals($('#sex').val(),'Sex'))
    {
        $('.sexWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.sexWarning').css("display","none");
    }
    if(!validator.isMobilePhone($('#phoneNo').val()))
    {   
        $('.phoneNoWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.phoneNoWarning').css("display","none");
    }
    if(validator.isAfter($('#dob').val()))
    {
        $('.dateWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.dateWarning').css("display","none");
    }

    if(!(validator.equals($('#email').val(),$('#checkEmail').val())))
    {
        $('.emailWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.emailWarning').css("display","none");
    }

    if(!(validator.equals($('#password').val(),$('#checkPassword').val())))
    {
        $('.passwordWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.passwordWarning').css("display","none");
    }

    return valid;
}
