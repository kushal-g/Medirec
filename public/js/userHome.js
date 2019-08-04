$('[data-toggle="dropdown"]').click(function () {
    $(this).next('.dropdown-menu').slideToggle(300);
    const $dropMenu = $(this);

    $(this).siblings('.dropdown-menu').children('.dropdown-item').click(e => {
        $($dropMenu).next('.dropdown-menu').slideUp(300);
    });
});

socket = io("http://localhost:3000");
const user_id = $('#user').val();
const userFirstName = $('#userFirstName').val();
const userLastName = $('#userLastName').val();
console.log(userFirstName,userLastName);

//Notification
socket.emit('notificationRequest',user_id,foundUser=>{
    
    if(foundUser.docAssignment_req.length!=0){
        $('.badge').text(foundUser.docAssignment_req.length);
        
        let notificationMenuHTML = "";
        for(let i=0;i<foundUser.docAssignment_req.length;i++){
            
            notificationMenuHTML +=
            `<a class="dropdown-item" href="#">Dr. ${foundUser.docAssignment_req[i].firstName} ${foundUser.docAssignment_req[i].lastName} wants you to come under his treatment.</a>
            <div class="dropdown-divider"></div>`;

        }
        
        
        $('.notificationMenu').html(notificationMenuHTML);
    }else{
        $('.dropdown-toggle-split').prop('disabled',true);
    }
    
});