$('.dropdown-toggle').click(function() {
    $(this).next('.dropdown-menu').slideToggle(300);
  });

$('.dropdown-menu').mouseleave(()=>{
  $('.dropdown-menu').slideUp(500);
})