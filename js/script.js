$(document).ready(function(){
    $("input#email").focus(function(){
        $("div#mail-err").css("display", "none");
    });
    $("input#password").focus(function(){
        $("div#psw-err").css("display", "none");
    });
    $("input").focus(function(){
        $("div.msg_err").css("display", "none");
    });

});

function arrow() {
    $(document).ready(function(){
        $("div.arrow").animate({
            right: "+=3px"}, 200 );
        $("div.arrow").animate({
            right: "-=3px"}, 200, function() {
                arrow();
            });
    })
} arrow();

