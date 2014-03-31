function initialize_nav(page) {
    $("button#patient").click(function () {
       window.location="/patient"; 
    });
    $("button#nurse").click(function () {
       window.location="/user"; 
    }); 
    $("button#reports").click(function () {
       window.location="/reports";
    });
    $(page).css("font-weight", "bold");
}
