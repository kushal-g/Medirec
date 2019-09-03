
const valid = () =>{
    let valid=true;
    
     if(!validator.isAlpha($('#nationality').val()))
    {
        $('.nationalityWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.nationalityWarning').css("display","none");
    }
    

    if(!validator.isNumeric($('#IDno').val(),{no_symbols: true}))
    {
        $('.IDnoWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.IDnoWarning').css("display","none");
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
    
    if(validator.isAfter($('#dob').val()))
    {
        $('.dateWarning').css("display","inline");
        valid=false;
    }
    else
    {
        $('.dateWarning').css("display","none");
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

    return valid;
}