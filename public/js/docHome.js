$('.dropdown-toggle').click(function() {
    $(this).next('.dropdown-menu').slideToggle(300);
  });

$('.dropdown-menu').mouseleave(()=>{
  $('.dropdown-menu').slideUp(500);
});

socket = io("http://localhost:3000");
console.log();
//"Your Patients section"
const user_id = $('#user').val();
socket.emit('sendMyPatients',user_id);
socket.on('recieveYourPatients',patients=>{

  var patientsHTML="";
  patients.data.forEach(patient=>{
    patientsHTML += `<li class="list-group-item">${patient.profile.firstName}</li>`
  });

  $('#patientsList').html(patientsHTML);
});
