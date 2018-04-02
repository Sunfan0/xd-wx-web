if (ocean.getUser()) {
    ocean.get("resources/biz/order/data_count", {
        userId: ocean.getUser(),
        type: "car"
    }, function (data) {
        if (data.code == 0) {
            var content = data.data;
            console.log(data);
            if (content > 0) {
                $("#shopping").show();
                $("#shopping").html(content);
            } else {
                $("#shopping").hide();
            }
        }
    }, function () {
        exceptionBox();
    });
} else {
    $("#shopping").show();
    var leaseLocalBookList = ocean.getLocalShoppingCarList("lease");
    console.log(JSON.stringify(leaseLocalBookList));
    leaseNum = leaseLocalBookList.length;

    var buyLocalBookList = ocean.getLocalShoppingCarList("buy");
    console.log(JSON.stringify(leaseLocalBookList));
    buyNum = buyLocalBookList.length;
    if (buyNum + leaseNum > 0) {
        $("#shopping").html(buyNum + leaseNum);
        $(".book_number").html(buyNum + leaseNum);
    } else {
        $("#shopping").hide();
    }
}