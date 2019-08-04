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

//Notification (checks every second if someone sent request)
//Notification 
const checkNotifs = () => {
    console.log("Running");
    socket.emit('notificationRequest', user_id, foundUser => {

        if (foundUser.docAssignment_req.length != 0) {
            $('.badge').text(foundUser.docAssignment_req.length);

            let notificationMenuHTML = "";
            for (let i = 0; i < foundUser.docAssignment_req.length; i++) {

                notificationMenuHTML +=
                    `<div class="dropdown-divider"></div>
                    <div class="container-fluid"> 
                        <div class="row">
                            <div class="col-sm-10">
                            Dr. ${foundUser.docAssignment_req[i].firstName} ${foundUser.docAssignment_req[i].lastName} wants you to come under his treatment.
                            </div>
                            <div class="col responseButtons">
                                <input type="hidden" value="${foundUser.docAssignment_req[i]._id}">
                                <input type="button" class="img-accept mx-2 mt-1">
                                <input type="button" class="img-reject mx-1 mt-1">
                            </div>
                        </div>
                    </div>
                    `;
            }
            $('.notificationMenu').html(notificationMenuHTML);
            $('.dropdown-toggle-split').prop('disabled', false);


            //SENDING WHETHER USER HAS ACCEPTED OR NOT
            $('.img-accept').click(e=>{
                const docID = $(e.target).siblings('input[type="hidden"]').val();
                socket.emit('acceptRequest',{loggedInUser:user_id,acceptDoctor:docID},accepted=>{
                    if(accepted){
                        $(e.target).css("background","url('/images/checked-green.png') no-repeat")
                    }
                });
            });

            $('.img-reject').click(e=>{
                const docID = $(e.target).siblings('input[type="hidden"]').val();
                socket.emit('rejectRequest',{loggedInUser:user_id,rejectDoctor:docID},rejected=>{
                    if(rejected){
                        console.log('Complete');
                    }
                });
            });

        } else {
            $('.notificationMenu').html("");
            $('.badge').text("");
            $('.dropdown-toggle-split').prop('disabled', true);
            $('.dropdown-toggle-split').next('.dropdown-menu').slideUp(300);
        }
    })
}

checkNotifs();
//Checks every second for notification
setInterval(checkNotifs, 1000);

