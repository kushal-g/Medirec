const socket = io("http://localhost:3000");


let username1Condition=false;
let username2Condition=false;
let sameSexCondition=false;

$('#parentsCheck').click(e=>{

    if($(e.currentTarget).children("div").first().hasClass("off")){
        $("#proceed").prop('disabled', false);
    }else{
        if($('#numOfParents').val()==2){

            if(username1Condition&&username2Condition&&sameSexCondition){
                $("#proceed").prop('disabled', false);
            }else{
                $("#proceed").prop('disabled', true);
            }

        }else{
            if(username1Condition){
                $("#proceed").prop('disabled', false);
            }else{
                $("#proceed").prop('disabled', true);
            }
        }
    }
    $('.formContent').slideToggle();
})

$('#numOfParents').change(e=>{
    if($(e.target).val()==2){
        
        if(username1Condition&&username2Condition&&sameSexCondition){
            $("#proceed").prop('disabled', false);
        }else{
            $("#proceed").prop('disabled', true);
        }
        $('.parent2Wrapper').slideDown();
    }else{
        if(username1Condition){
            $("#proceed").prop('disabled', false);
        }else{
            $("#proceed").prop('disabled', true);
        }
        $('.parent2Wrapper').slideUp();
    }
});


$('#parent1Username').keyup(e=>{
    const parentUsername = $(e.target).val();
    $.get('/usercheck?username='+parentUsername.toLowerCase(),accountExists=>{
        if(accountExists){
            $(".parent1Warning").slideUp();
            username1Condition=true;

            if($('#numOfParents').val()==2){
                if(username1Condition&&username2Condition){
                    socket.emit("checkSameSex",{
                        parent1Username:$('#parent1Username').val(),
                        parent2Username:$('#parent2Username').val()
                    },sameSex=>{
                        sameSexCondition=!sameSex;
                        if(sameSex){
                            $("#proceed").prop('disabled', true);
                            $('.sameSexWarning').slideDown();
                        }else{
                            $("#proceed").prop('disabled', false);
                            $('.sameSexWarning').slideUp();
                        }
                    });
                }
            }else{
                $("#proceed").prop('disabled', false);
            }
            
        }else{
            $(".parent1Warning").slideDown();
            $('.sameSexWarning').slideUp();
            username1Condition=false;
            $("#proceed").prop('disabled', true);
        }
    })
})


$('#parent2Username').keyup(e=>{
    const parentUsername = $(e.target).val();
    
    $.get('/usercheck?username='+parentUsername.toLowerCase(),accountExists=>{
        
        if(accountExists){
            $(".parent2Warning").slideUp();
            username2Condition=true;
            if(username1Condition&&username2Condition){
                socket.emit("checkSameSex",{
                    parent1Username:$('#parent1Username').val(),
                    parent2Username:$('#parent2Username').val()
                },sameSex=>{
                    sameSexCondition=!sameSex;
                    if(sameSex){
                        $("#proceed").prop('disabled', true);
                        $('.sameSexWarning').slideDown();
                    }else{
                        $("#proceed").prop('disabled', false);
                        $('.sameSexWarning').slideUp();
                    }
                });
            }
        }else{
            $(".parent2Warning").slideDown();
            $('.sameSexWarning').slideUp();
            username2Condition=false
            $("#proceed").prop('disabled', true);
        }
    })
})