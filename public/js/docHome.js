$('.dropdown-toggle').click(function() {
    $(this).next('.dropdown-menu').slideToggle(300);
  });

socket = io("http://localhost:3000");
const user_id = $('#user').val();

//"Your Patients" section

socket.emit('sendMyPatients',user_id,patients=>{

  let patientsHTML="";
  patients.data.forEach(patient=>{
    patientsHTML += `<li class="list-group-item">${patient.profile.firstName} ${patient.profile.lastName}</li>`
  });

  $('#patientsList').html(patientsHTML);
});


//"Search" section

$('#searchForm').submit(e => {
  e.preventDefault();
  const searchQuery = $('#searchQuery').val();

  socket.emit('sendSearchResults', {searchQuery:searchQuery, loggedInUser:user_id},searchResult => {
    let searchHTML = "";
    searchResult.forEach(result => {
      searchHTML += `<li class="list-group-item">
        <div class="row">          
            <div class="col">
            ${result.profile.firstName} ${result.profile.lastName}
            </div>
            <div class="col-auto my-auto">
                <form action="/home/addPatient" method="post">
                    <input type="hidden" name="patient_id" value="${result._id}" >
                    <input type="image" class="img-add" src="images/add.png" alt="+">
                </form>
            </div>
        </div>
    </li>`
    });

    $('#searchResultList').html(searchHTML);
    $('#searchResult-tab').tab('show');
  });
});