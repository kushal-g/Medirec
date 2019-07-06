$(document).ready(()=>{
    $('.card').css('opacity', 0).slideDown('slow').animate({opacity: 1}, {queue: false,duration: 'slow'});
});

$('#loginDetails').submit(e=>{
    e.preventDefault();
})