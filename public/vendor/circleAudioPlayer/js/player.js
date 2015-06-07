/**
 * Globals
 */
var PLAYER;


/**
 * Set progress indicator value
 * @param  {[type]} percent [description]
 * @return {[type]}         [description]
 */
function progress(percent) {
    if(percent > 100) return ;

    var angle = percent * 360 / 100;

    $('.spinner').css('-webkit-transform', 'rotate(' + angle + 'deg)');
    if (percent > 50) {
        $('.filler').css('opacity', '1');
        $('.mask').css('opacity', '0');
    } else {
        $('.filler').css('opacity', '0');
        $('.mask').css('opacity', '1');
    }
}

/**
 * Play action
 * @return {[type]} [description]
 */
function play() {
    PLAYER.play();
    $('.icon-play').hide();
    $('.icon-pause').show();
}


/**
 * Pause action
 * @return {[type]} [description]
 */
function pause() {
    PLAYER.pause();
    $('.icon-play').show();
    $('.icon-pause').hide();
}

$(document).ready(function () {

    PLAYER = $('#player').get(0);

    PLAYER.volume = '1';

    $('.icon-play').click(function() {
      play();
    });

    $('.icon-pause').click(function() {
      pause();
    });

    PLAYER.addEventListener('timeupdate', function (evt) {
        var played = PLAYER.currentTime / PLAYER.duration * 100;
        progress(played);
    });

    PLAYER.addEventListener('ended', function (evt) {
        pause();
        progress(0);
    });
});