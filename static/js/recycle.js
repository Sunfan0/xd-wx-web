function checkBook(isbn, onError) {
    ocean.get('resources/biz/books/recycle_check', {isbn: isbn}, function (res) {
        console.log(res);
        if (res.code == 0) {
            checkSuccess(res.data);
        }
        $(".written .error").hide();
        $(".affirm").css("margin-top", "20px");
    }, function (error) {
        try {
            onError(error);
        } catch (e) {
            ocean.tip(error.message);
            $(".written .error").show();
            $(".affirm").css("margin-top", "10px");
        }
    })
}