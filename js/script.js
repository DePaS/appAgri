$(document).ready(function(){
    $("input#email").focus(function(){
        $("h4#mail-err").css("display", "none");
    });
    $("input#password").focus(function(){
        $("h4#psw-err").css("display", "none");
    });
    $("input").focus(function(){
        $("h4#campi-err").css("display", "none");
    });
});
