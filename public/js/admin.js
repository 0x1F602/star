$(document).ready(function () {
    $('button#submit_race').click(function () {
        var name = $('input#race_name').val();
        var desc = $('textarea#zod').text();
        console.log(desc);
        //$.post('/admin/add_race', {
        //    data: {
        //        name: name,
        //        desc: desc 
        //    }
        //}, function () {
        //    alert('Sent');
        //});
    });
});
