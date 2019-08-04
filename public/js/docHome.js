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

//"Your Patients" section
socket.emit('sendMyPatients',user_id,patients=>{

  let patientsHTML="";
  patients.data.forEach(patient=>{
    patientsHTML += `<li class="list-group-item">${patient.profile.firstName} ${patient.profile.lastName}</li>`
  });

  $('#patientsList').html(patientsHTML);
});


//"Search" section

$('#searchButton').click(e => {
  e.preventDefault();
  const searchQuery = $('#searchQuery').val();

  socket.emit('sendSearchResults', {searchQuery:searchQuery, loggedInUser:user_id},searchResult => {
    let searchHTML = "";
    searchResult.forEach(result => {

      if(result.docAssignment_req.filter(request => request._id === user_id).length > 0){
        searchHTML += `<li class="list-group-item">
        <div class="row">          
            <div class="col">
            ${result.profile.firstName} ${result.profile.lastName}
            </div>
            <div class="col-auto my-auto">
                <form class="addPatient">
                    <input type="button" class="img-reqSent" disabled>
                    <input type="hidden" class="patientID" value="${result._id}">
                </form>
            </div>
        </div>
    </li>`;
      }else{
        searchHTML += `<li class="list-group-item">
        <div class="row">          
            <div class="col">
            ${result.profile.firstName} ${result.profile.lastName}
            </div>
            <div class="col-auto my-auto">
                <form class="addPatient">
                    <input type="button" class="img-add">
                    <input type="hidden" class="patientID" value="${result._id}">
                </form>
            </div>
        </div>
    </li>`;
      }



      
    });

    
    

    $('#searchResultList').html(searchHTML);


    //Add Patients
    $('.addPatient input[type="button"]').click(e=>{
      const addRequestID = $(e.target).siblings('input[type="hidden"]').val();

      socket.emit('addPatientRequest',
        {patientID:addRequestID, 
        loggedInUser:user_id, 
        loggedInUserFName:userFirstName, 
        loggedInUserLName:userLastName},
        sent=>{
        if(sent){
          //Turn plus to check and disable it
          $(e.target).removeClass("img-add");
          $(e.target).addClass("img-reqSent");
          $(e.target).prop('disabled',true);
        }
      });
    });

    
    $('#searchResult-tab').tab('show');
    $('.active').removeClass('active');
  });
});
