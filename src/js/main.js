$(function() {
  // everything on document ready
  // tab functions
  $('.tab-button').on('click', function() {
    $(this).parent().children('.tab-button').removeClass('is-active');
    $(this).addClass('is-active');
    var box = $(this).data('box');
    $('.popup-div').find('.tab-item').hide();
    $('.popup-div').find('.tab-item[data-box=' + box + ']').show();
  });

});