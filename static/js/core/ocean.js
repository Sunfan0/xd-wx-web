var debug = true;
var timestamp = "-0130";
var appid = debug ? "wx3944d9162533ccc0" : "wxf2d6d10e73a0cdd0";

// var apiUri = debug ? "http://192.168.1.165:666/admin/" : "http://www.pandabox.top/admin/";
// var ctxPath = debug ? "http://192.168.1.165:8090/xd-wx-web/" : "http://www.pandabox.top/";

var apiUri = "http://203j98021s.imwork.net:17285/admin/";
// var ctxPath = "http://test.xasqkj.com/";
var ctxPath = "http://192.168.0.103:8080/xd-wx-web/";

var default_authorization = "Basic cm9vdDpyb290";
var login_user_cookie_key = "xd-user-id";
var current_city_cookie_key = "xd-city";
var openid_cookie_key = "xd-open-id";

/**
 * Cookie 相关
 */
var ocean_cookie = function () {
    var self = this;

    this.getCookie = function (key) {
        key = key + timestamp;
        var arr, reg = new RegExp("(^| )" + key + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg)) {
            return decodeURI(arr[2]);
        } else {
            return null;
        }
    };

    this.setCookie = function (name, value) {
        name = name + timestamp;
        var Days = 7;
        var exp = new Date();
        exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
        document.cookie = name + "=" + encodeURI(value) + ";expires=" + exp.toGMTString() + ";path=/";
    };

    this.clearCookie = function (key) {
        var exp = new Date();
        exp.setTime(exp.getTime() - 10000);
        var cval = self.getCookie(key);
        if (cval != null) {
            document.cookie = key + timestamp + "=" + encodeURI(cval) + ";expires=" + exp.toGMTString() + ";path=/";
        }
    }
};


/**
 * 核心业务
 * @param cookie
 * @returns {ocean_core}
 */
var ocean_core = function (cookie) {
    var self = this;

    this.post = function (url, params, success, failure) {
        httpQuery(url, 'POST', params, success, failure);
    };

    this.get = function (url, params, success, failure) {
        httpQuery(url, 'GET', params, success, failure);
    };

    this.getLoginUserId = function () {
        return cookie.getCookie(login_user_cookie_key);
    };

    this.logout = function () {
        cookie.clearCookie(login_user_cookie_key);
    };

    this.currentCity = function () {
        return JSON.parse(cookie.getCookie(current_city_cookie_key) || "{}");
    };

    this.currentCityId = function () {
        return JSON.parse(cookie.getCookie(current_city_cookie_key) || "{}").id;
    };

    this.getOpenId = function () {
        return cookie.getCookie(openid_cookie_key);
    };

    this.getRequestParameter = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)
            return decodeURI(r[2]);
        return null;
    };

    this.tip = function (message, callback) {
        weui.alert(message, callback, {});
    };

    this.toast = function (message) {
        weui.toast(message, {
            duration: 1000,
            className: "bears"
        });
    };

    function httpQuery(url, type, params, success, failure) {
        $.ajax({
            url: apiUri + url,
            headers: {
                'Authorization': default_authorization
            },
            type: type,
            data: params
        }).done(function (data) {
            success(data);
        }).fail(function (xhr) {
            try {
                var error = xhr.responseJSON;
                try {
                    failure(error);
                } catch (e) {
                    ocean.tip(error.message);
                }
            } catch (e) {
            }
        });
    }

    function onBridgeReady(params, id, type, callBack) {
        WeixinJSBridge.invoke(
            'getBrandWCPayRequest', {
                "appId": params.appId,                 //公众号名称，由商户传入
                "timeStamp": params.timeStamp,         //时间戳，自1970年以来的秒数
                "nonceStr": params.nonceStr,           //随机串
                "package": params.package,
                "signType": params.signType,           //微信签名方式：
                "paySign": params.sign                 //微信签名
            },
            function (res) {
                if (res.err_msg == "get_brand_wcpay_request:ok") {
                    var loading = weui.loading('loading');
                    judgePaid(id, type, callBack, loading);
                }
            }
        );
    }

    function judgePaid(id, type, callback, loading) {
        self.get("resources/biz/order/isPaid", {id: id, type: type}, function (res) {
            if (res.code == 0) {
                loading.hide();
                if (callback) {
                    callback();
                } else {
                    location.href = ctxPath + "/page/order/success.html?id=" + id + "&type=" + type;
                }
            } else {
                setTimeout(function () {
                    judgePaid(id, type, callback);
                }, 1000);
            }
        });
    }

    /**
     * 支付
     * @param params
     * @param id
     * @param type
     * @param callBack
     */
    this.pay = function (params, id, type, callBack) {
        if (typeof WeixinJSBridge == "undefined") {
            if (document.addEventListener) {
                document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
            } else if (document.attachEvent) {
                document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
            }
        } else {
            onBridgeReady(params, id, type, callBack);
        }
    };


    this.showLogin = function (callback) {
        new loginBox(callback);
    };

    return self;
};

/**
 * 获取当前位置地理信息。
 * @param onSuccess(data) data为地理信息(city,street等)。
 * @param onFail(error) 获取当前位置信息失败，error为失败信息。
 */
var baiduLocation = function (onSuccess, onFail) {
    var geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function (r) {
        if (this.getStatus() === BMAP_STATUS_SUCCESS) {
            var geoc = new BMap.Geocoder();
            geoc.getLocation(r.point, function (rs) {
                var addComp = rs.addressComponents;
                onSuccess(addComp);
            });
        }
        else {
            onFail('failed' + this.getStatus());
        }
    }, {enableHighAccuracy: true})
};

/**
 * 购物车相关
 * @param ocean
 * @returns {ocean_shopping_car}
 */
var ocean_shopping_car = function (type) {
    this.type = type || '';
    var self = this;
    var storage_key = "xd-local-shopping-car-";

    /**
     * 添加本地购物车。
     * 用户在未登录状态下点击添加购物车时调用。
     * @param book 绘本详情的JSON。
     */
    function pushToLocal(book) {
        var array = self.getLocalCarList();
        for (var i = 0; i < array.length; i++) {
            if (array[i].id === book.id) {
                array[i].addTime = Date.parse(new Date());
                array.sort(function (a, b) {
                    return a.addTime < b.addTime;
                });
                localStorage.setItem(storage_key + self.type, JSON.stringify(array));
                return;
            }
        }
        book.addTime = Date.parse(new Date());
        array.push(book);
        array.sort(function (a, b) {
            return a.addTime < b.addTime;
        });
        localStorage.setItem(storage_key + self.type, JSON.stringify(array));
    };

    function popFormLocal(bookId) {
        var list = self.getLocalCarList();
        if (list !== null && list.length > 0) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === bookId) {
                    list.splice(i, 1);
                    break;
                }
            }
            localStorage.setItem(storage_key + self.type, JSON.stringify(list));
        }
    };

    this.push = function (book, callback) {
        if (ocean.getLoginUserId()) {
            ocean.get("resources/biz/api/car/push", {
                userId: ocean.getLoginUserId(),
                bookId: book.id,
                price: book.price,
                type: self.type
            }, function (res) {
                if (res.code === 0) {
                    ocean.toast("添加购物车成功！");
                    if (callback) {
                        callback();
                    }
                }
            }, function () {
                ocean.tip("添加购物车失败！");
            })
        } else {
            pushToLocal(book);
            if (callback) {
                callback();
            }
        }
    };

    this.pop = function (bookId, callback) {
        if (ocean.getLoginUserId()) {
            ocean.get("resources/biz/api/car/pop", {
                userId: ocean.getLoginUserId(),
                bookId: bookId,
                type: self.type
            }, function (data) {
                if (data.code == 0) {
                    if (callback) {
                        callback();
                    }
                }
            }, function () {
                exceptionBox();
            });
        } else {
            popFormLocal(bookId);
            if (callback) {
                callback();
            }
        }
    };

    this.count = function () {
        if (ocean.getLoginUserId()) {
            return 0;
        } else {
            return self.getLocalCarList().length;
        }
    };

    this.list = function (callback) {
        if (ocean.getLoginUserId()) {
            ocean.get("resources/biz/api/car/list", {
                userId: ocean.getLoginUserId(),
                type: self.type
            }, function (res) {
                if (res.code == 0) {
                    if (callback) {
                        callback(res.data);
                    }
                } else {
                    if (callback) {
                        callback(null);
                    }
                }
            }, function () {
                exceptionBox();
            });
        } else {
            if (callback) {
                callback(self.getLocalCarList());
            }
        }
    };

    /**
     * 获取本地保存的购物车列表。
     * @returns Array，若为null返回一个空数组。数组类型为localAddShoppingCar添加的类型。
     */
    this.getLocalCarList = function () {
        return JSON.parse(localStorage.getItem(storage_key + self.type) || "[]");
    };

    /**
     * 清空本地购物车列表数据。
     */
    this.clear = function () {
        localStorage.removeItem(storage_key + self.type);
    };

    /**
     * 同步本地购物车列表至服务器。
     */
    this.upload = function () {
        var list = self.getLocalCarList();
        if (list != null && list.length > 0) {
            var book = [];
            $.each(list, function (index, item) {
                book.push(item.id + "@" + item.price);
            });
            ocean.post("resources/biz/api/car/upload", {
                userId: ocean.getLoginUserId(),
                books: book.join(","),
                type: self.type
            }, function (res) {
                if (res.code == 0) {
                    console.log("同步购物车成功");
                    self.clear();
                }
            }, function () {
                console.log("同步购物车失败");
            });
        }
    };
    return self;
};

function buy_shopping_car() {
    ocean_shopping_car.call(this);
    this.type = 'buy';
}

function lease_shopping_car() {
    ocean_shopping_car.call(this);
    this.type = 'lease';
}

function leaseCardJudge(callback, fail) {
    var loading;
    if (ocean.getLoginUserId()) {
        loading = weui.loading('loading');
        ocean.get("resources/biz/api/leaseCard/judge", {userId: ocean.getLoginUserId()}, function (res) {
            loading.hide();
            if (res.code == 0) {
                callback()
            }
        }, function (err) {
            loading.hide();
            if (err.code == 110101 || err.code == 110102) {
                fail(err.message);
            } else {
                ocean.tip(err.message);
            }
        })
    } else {
        ocean.showLogin();
    }
}

(function () {
    var Super = function () {
    };
    Super.prototype = ocean_shopping_car.prototype;
    buy_shopping_car.prototype = new Super();
    lease_shopping_car.prototype = new Super();
})();

var ocean_banner = function (elem) {
    new Swiper(elem, {
        autoplay: 3000,
        speed: 1000,
        autoplayDisableOnInteraction: false,
        loop: true,
        centeredSlides: true,
        slidesPerView: 1,
        calculateHeight: true,
        initialSlide: 0,
        spaceBetween: 0,
        followFinger: false,
        pagination: '.swiper-pagination',
        passiveListeners: false,
        preventClicks: true,
        breakpoints: {
            300: {
                slidesPerView: 1
            }
        },

        onTap: function (data, event) {
            var item = $(".swiper-slide")[data.activeIndex];
            console.log(item);
            if ($(item).hasClass("type_book")) {
                location.href = "book_detail.html?id=" + $(item).data("id");
            } else if ($(item).hasClass("type_url")) {
                var url = $(item).data("id");
                if (url.indexOf("http://") == -1 && url.indexOf("https://") == -1) {
                    url = "http://" + url;
                }
                window.open(url);
            } else if ($(item).hasClass("type_message")) {
                location.href = "message.html?id=" + $(item).data("id");
            }
        }
    });
};

var ocean_jssdk = function (onReady) {
    var self = this;

    this.init = function () {
        ocean.get("resources/biz/wx/jssdk", {
            url: location.href
        }, function (res) {
            if (res.code == 0) {
                initWx(res.data);
            }
        });
        return self;
    };

    this.scanIsbn = function (callBack) {
        if (debug) {
            callBack('9787508681078');
            return;
        }
        wx.scanQRCode({
            needResult: 1,
            scanType: ["qrCode", "barCode"],
            success: function (res) {
                var result = res.resultStr;
                var isbn = result.substring(result.indexOf(",") + 1);
                if (isbn.length == 13) {
                    callBack(isbn);
                } else {
                    self.tip("请手动输入isbn编码!");
                    var isbn_box = new isbnBox(isbn_box_callback);
                    isbn_box.show();
                }
            }
        });
    };

    function initWx(data) {
        wx.config({
            debug: false,
            appId: data.appId,
            timestamp: data.timestamp,
            nonceStr: data.nonceStr,
            signature: data.signature,
            jsApiList: [
                'checkJsApi',
                'scanQRCode',
                'onMenuShareTimeline',
                'onMenuShareAppMessage',
                'onMenuShareQQ',
                'onMenuShareWeibo',
                'hideMenuItems',
            ]
        });

        wx.ready(function () {
            console.log("jsSdk init success");
            try {
                onReady()
            } catch (e) {
            }
        });

        wx.error(function (res) {
            console.error(res);
        });
    }

    return self;
};

var isbnBox = function (callback, key, checkUri) {
    var self = this;
    var storage_key = key || 'recycle-book-list';
    this.books = JSON.parse(sessionStorage.getItem(storage_key) || "{}")
    console.log(this.books)
    this.isbnArr = [];
    for (var isbn in this.books) {
        this.isbnArr.splice(0, 0, isbn);
    }
    var html = "<div class=\"isbn_box\">\n" +
        "    <div class=\"box\">\n" +
        "        <span class=\"close\">×</span>\n" +
        "        <p class=\"title\">\n" +
        "            手动输入条码号\n" +
        "        </p>\n" +
        "        <div class=\"bar_img\">\n" +
        "            <div></div>\n" +
        "        </div>\n" +
        "        <p class=\"text\">\n" +
        "            <input id=\"isbn\" type=\"number\" placeholder=\"ISBN 条码\">\n" +
        "        </p>\n" +
        "        <p class=\"error_msg\">\n" +
        "            你输入的ISBN码有误，请重新输入\n" +
        "        </p>\n" +
        "        <p class=\"affirm\">\n" +
        "            <button type=\"button\" id=\"check\">确认</button>\n" +
        "        </p>\n" +
        "    </div>\n" +
        "</div>";
    $("body").append(html);

    $(".isbn_box .box .affirm button").on("click", function () {
        var isbn = $(".isbn_box .box .text #isbn").val();
        if (isbn.isEmpty()) {
            ocean.tip("请输入ISBN");
            return;
        }
        self.checkBookIsbn(isbn);
    });

    $(".isbn_box .box .close").on("click", function () {
        $(".isbn_box").hide();
    });

    this.show = function () {
        $(".isbn_box .box .text #isbn").val("");
        $(".isbn_box").show();
    };

    this.close = function () {
        $(".isbn_box").hide();
    };

    this.isEmpty = function () {
        return self.isbnArr.length == 0;
    };

    this.size = function () {
        return self.isbnArr.length;
    };

    this.each = function (fun) {
        $.each(self.isbnArr, function (index, isbn) {
            fun(isbn, self.books[isbn]);
        });
    };

    this.remove = function (isbn) {
        var book = self.books[isbn];
        delete self.books[isbn];
        self.isbnArr.remove(isbn);
        sessionStorage.setItem(storage_key, JSON.stringify(self.books));
        return book;
    };

    this.checkBookIsbn = function (isbn) {
        ocean.get(checkUri || 'resources/biz/api/recycle/check', {isbn: isbn}, function (res) {
            if (res.code == 0) {
                checkSuccess(isbn, res.data);
                $(".isbn_box .error_msg").hide();
                $(".isbn_box .affirm").css("margin-top", "20px");
                self.close();
            }
        }, function (error) {
            if ($(".fail_popup").length > 0) {
                $(".fail_popup").show();
            } else {
                ocean.tip(error.message);
            }
            self.close();
        });
    };

    function checkSuccess(isbn, book) {
        if (self.books[isbn] != null) {
            ocean.tip("不能重复添加图书");
            return;
        }
        self.isbnArr.splice(0, 0, isbn);
        self.books[isbn] = book;
        sessionStorage.setItem(storage_key, JSON.stringify(self.books));

        if (callback) {
            callback(isbn, book);
        }
    }

    return self;
};

var score_star = function (s) {
    $.each($(".star"), function () {
        var score = s || parseFloat($(this).data("score"));
        $.each($(this).find("img"), function () {
            if (score >= 2) {
                $(this).attr("src", ctxPath + "static/img/bookinfo/star1.png");
            } else {
                if (score >= 0.5) {
                    $(this).attr("src", ctxPath + "static/img/bookinfo/star0_1.png");
                } else {
                    $(this).attr("src", ctxPath + "static/img/bookinfo/star0.png");
                }
            }
            score -= 2;
        });
    });
};

var cookie = new ocean_cookie();
var ocean = new ocean_core(cookie);
var buyShoppingCar = new buy_shopping_car();
var leaseShoppingCar = new lease_shopping_car();
if (debug) {
    ocean.post('resources/biz/api/login', {
        nickname: 'debug',
        openId: 'debug',
        head: ''
    }, function (data) {
        if (data.code == 0) {
            localStorage.setItem("ocean-xd-user", JSON.stringify(data.data));
            cookie.setCookie(login_user_cookie_key, data.data.id);
            if (data.data.token == "new") {
                $(".welcome_popup").show();
            }
        }
    }, function (error) {
        ocean.tip(error.message);
    });
} else if (sessionStorage.getItem(openid_cookie_key) == null) {
    var code = ocean.getRequestParameter("code");
    if (code == null) {
        var from_url = location.href;
        var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + appid + '&redirect_uri=' + encodeURIComponent(from_url) + '&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect';
        location.href = url;
    } else {
        ocean.get("resources/biz/wx/detail", {code: code}, function (res) {
            var wxUser = res.data;
            sessionStorage.setItem(openid_cookie_key, res.data.openid);
            cookie.setCookie(openid_cookie_key, res.data.openid);
            localStorage.setItem("wxUserDetail", JSON.stringify(res.data));

            var corner = sessionStorage.getItem("ocean_corner") || 'pandabox';
            ocean.post('resources/biz/api/login', {
                label: corner,
                nickname: debug ? 'debug' : wxUser.nickname.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, ""),
                openId: debug ? 'debug' : wxUser.openid,
                head: debug ? '' : wxUser.headimgurl
            }, function (data) {
                if (data.code == 0) {
                    localStorage.setItem("ocean-xd-user", JSON.stringify(data.data));
                    cookie.setCookie(login_user_cookie_key, data.data.id);
                    if (data.data.token == "new") {
                        $(".welcome_popup").show();
                    }
                }
            }, function (error) {
                ocean.tip(error.message);
            });
        })
    }
}

var exceptionBox = function () {
    var self = this;
    this.close = function () {
        $(".exception_Page").remove();
    };
    var exceptionHtml = '<div class="exception_Page">' +
        '<div class="exception_bg"></div>' +
        '<div class="exception_content">' +
        '<div class="content_img"></div>' +
        '<p class="text">熊猫在开小差</p>' +
        '<p class="text">请您稍后再来</p>' +
        '<p class="exception_btn">确定</p>' +
        '</div>' +
        '</div>';
    $("body").append(exceptionHtml);

    $(".exception_btn,.exception_bg").click(function () {
        self.close();
    });
};
