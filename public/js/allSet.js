
const animation_check=callback=>{
    $('.check').animate({ deg: 720,},{duration: 1200,step: function(now) {
        $(this).css({ transform: 'rotate(' + now + 'deg)' });
        }
    });
}

const animation_content=()=>{
    $('.content-child').slideDown(1500);

}

animation_check(animation_content());

