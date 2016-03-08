/// <reference path="jquery.d.ts" />
(function ($) {
    var overlay, wrap, center, content, responsive, bgImage, image, prev, next, bottomContainer, bottom, close, counter, caption, closeText, img = new Image(), preloadP = new Image(), preloadN = new Image(), images = [], win = $(window), options = {}, activeImage, changing = false, open = false, queued = -1, animations = [], timeout, defaults = {
        initialSize: 200,
        lang: {
            close: 'Close',
            prev: 'Previous',
            next: 'Next',
            counter: 'Image {x} of {y}'
        },
        padding: 30,
        closeKeys: [27, 88, 67],
        prevKeys: [37, 80],
        nextKeys: [39, 78],
        loop: false,
        doubleClickTimeout: 200,
        root: $("body")[0],
        animation: {
            duration: 600,
            iterations: 1,
            delay: 0,
            easing: 'ease-in-out'
        }
    };
    $.fn.imagebox = function (_options, linkMapper, linksFilter) {
        linkMapper = linkMapper || function (el, i) {
            var im = {
                url: el.getAttribute("href") || undefined,
                title: el.getAttribute("title") || undefined,
                index: i
            };
            return im;
        };
        linksFilter = linksFilter || function (el, i) {
            return true;
        };
        var links = this;
        return links.unbind("click").click(function (evt) {
            var link = this, startIndex = 0, filteredLinks = [];
            for (var i = 0; i < links.length; i++) {
                if (linksFilter.call(link, links[i], i)) {
                    if (links[i] == link)
                        startIndex = i;
                }
                filteredLinks.push(linkMapper(links[i], i));
            }
            filteredLinks[startIndex].origin = {
                target: link
            };
            return $.imagebox(filteredLinks, startIndex, _options);
        });
    };
    $.imagebox = function (_images, startImage, _options) {
        $.extend(options, defaults, _options);
        images = _images;
        setup();
        if (_images[startImage].origin && _images[startImage].origin.target) {
            var link = _images[startImage].origin.target;
            var target = $($(link).find($(link).attr("data-target"))[0] || link);
            var bw = wrap.getBoundingClientRect();
            var bt = target[0].getBoundingClientRect();
            target.toggleClass('ib-line-fix', true);
            _images[startImage].origin.x = _images[startImage].origin.x || (bt.left - bw.left + target.innerWidth() / 2);
            _images[startImage].origin.y = _images[startImage].origin.y || (bt.top - bw.top + target.innerHeight() / 2);
            _images[startImage].origin.width = _images[startImage].origin.width || target.innerWidth();
            _images[startImage].origin.height = _images[startImage].origin.height || target.innerHeight();
            target.toggleClass('ib-line-fix', false);
        }
        $(center).css('max-width', getMaxSize(_images[startImage].origin ? _images[startImage].origin.width : options.initialSize, _images[startImage].origin ? _images[startImage].origin.height : options.initialSize, false).width + 2 * options.padding);
        changeImage(startImage);
        return false;
    };
    $.ibClose = function () {
        stop();
        $([wrap, bottomContainer, overlay]).toggleClass('visible', false);
        $(wrap).toggleClass('animating', false);
        if (activeImage)
            activeImage = undefined;
        $(document).off("keydown", keyDown);
        return false;
    };
    function changeImage(i) {
        if (i < 0 || i >= images.length)
            return false;
        stop();
        open = changing = true;
        activeImage = images[i];
        queued = activeImage.index;
        img.src = activeImage.url;
        $(caption).html(activeImage.title);
        $(counter).html((((images.length > 1) && options.lang.counter) || "").replace(/{x}/, (activeImage.index + 1) + '').replace(/{y}/, images.length + ''));
        var centerOrigin = {
            top: (activeImage.origin ? -($(wrap).innerHeight() / 2 - activeImage.origin.y) : 0) + 'px',
            left: (activeImage.origin ? -($(wrap).innerWidth() / 2 - activeImage.origin.x) : 0) + 'px'
        };
        activeImage.origin = undefined;
        var centerTarget = {
            top: '0px',
            left: '0px'
        };
        $(center).css(centerOrigin);
        $([wrap, overlay]).toggleClass('visible', true);
        $(wrap).toggleClass('animating', true);
        $(bottomContainer).toggleClass('visible', false);
        var anim = center.animate([
            centerOrigin, centerTarget
        ], options.animation);
        anim.addEventListener('finish', function () {
            $(center).css(centerTarget);
        });
        animations.push(anim);
        return false;
    }
    function setup() {
        $(closeText).html(options.lang.close);
        $([overlay, close]).attr('title', options.lang.close);
        $(options.root).append([overlay, wrap]);
        $(prev).attr('title', options.lang.prev);
        $(next).attr('title', options.lang.next);
        $(center).css('padding', options.padding);
        $(bgImage).toggleClass('loading', true);
        $(bgImage).css('background-image', '');
        $(image).css('opacity', 0);
        $([prev, next]).hide();
        $(document).on("keydown", keyDown);
        $(wrap).css({
            top: $(options.root).scrollTop(),
            left: $(options.root).scrollLeft()
        });
    }
    function showImage() {
        if (!open)
            return false;
        var px = prevIndex(), nx = nextIndex();
        if (px >= 0) {
            $(prev).show();
            preloadP.src = images[px].url;
        }
        else {
            $(prev).hide();
        }
        if (nx >= 0) {
            $(next).show();
            preloadN.src = images[nx].url;
        }
        else {
            $(next).hide();
        }
        $(image).css({
            'background-image': "url('" + img.src + "')",
            'opacity': 0
        });
        $(wrap).css({
            top: $(options.root).scrollTop(),
            left: $(options.root).scrollLeft()
        });
        var anim = image.animate([{
                opacity: 0
            }, {
                opacity: 1
            }], options.animation);
        anim.addEventListener('finish', function () {
            $(image).css('opacity', 1);
            $(bgImage).toggleClass('loading', false);
            $(bgImage).css('background-image', "url('" + img.src + "')");
        });
        animations.push(anim);
        setMaxWidth(getMaxSize(img.width, img.height, true).width, function () {
            var anim = bottomContainer.animate([
                { 'max-height': '0px' },
                { 'max-height': '200px' }
            ], options.animation);
            anim.addEventListener('finish', function () {
                $(bottomContainer).toggleClass('visible', true);
                if (queued != activeImage.index && timeout < 0) {
                    changeImage(queued);
                }
                else {
                    changing = false;
                    $(wrap).toggleClass('animating', false);
                }
            });
            animations.push(anim);
        });
        return false;
    }
    function prevImage() {
        queued = prevIndex();
        if (queued < 0)
            queued = 0;
        queueChange();
        return false;
    }
    function nextImage() {
        queued = nextIndex();
        if (queued < 0)
            queued = images.length - 1;
        queueChange();
        return false;
    }
    function queueChange() {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            timeout = -1;
            if (!changing && queued != activeImage.index)
                changeImage(queued);
        }, options.doubleClickTimeout);
    }
    function prevIndex() {
        return (queued || (options.loop ? images.length : 0)) - 1;
    }
    function nextIndex() {
        return ((queued + 1) % images.length) || (options.loop ? 0 : -1);
    }
    function keyDown(event) {
        var code = event.which;
        return ($.inArray(code, options.closeKeys) >= 0) ? $.ibClose() : ($.inArray(code, options.nextKeys) >= 0) ? nextImage() : ($.inArray(code, options.prevKeys) >= 0) ? prevImage() : true;
    }
    function stop() {
        open = false;
        img.src = preloadP.src = preloadN.src = '';
        for (var i = 0; i < animations.length; i++)
            animations[i].cancel();
        animations = [];
    }
    function getMaxSize(width, height, animate) {
        var iw = width, ih = height;
        if (width + 2 * options.padding > $(wrap).innerWidth())
            width = $(wrap).innerWidth() - 2 * options.padding;
        height = (ih * width) / iw;
        if (height + 2 * options.padding > $(wrap).innerHeight())
            height = $(wrap).innerHeight() - 2 * options.padding;
        width = (height * iw) / ih;
        var ratio = (height * 100) / width;
        var target = {
            'padding-bottom': ratio + '%'
        };
        if (animate) {
            var origin = {
                'padding-bottom': $(responsive).css('padding-bottom')
            };
            var anim = responsive.animate([
                origin, target
            ], options.animation);
            anim.addEventListener('finish', function () {
                $(responsive).css(target);
            });
            animations.push(anim);
        }
        else {
            $(responsive).css(target);
        }
        return {
            width: width,
            height: height
        };
    }
    function setMaxWidth(width, callback) {
        width += 2 * options.padding;
        var anim = center.animate([{
                'max-width': $(center).css('max-width')
            }, {
                'max-width': width + 'px'
            }], options.animation);
        anim.addEventListener('finish', function () {
            $(center).css('max-width', width);
            if (typeof callback == 'function')
                callback();
        });
        animations.push(anim);
    }
    $(defaults.root).append($([
        overlay = $('<div id="ibOverlay" />').click($.ibClose)[0],
        wrap = $('<div id="ibWrap" />')[0]
    ]));
    center = $('<div id="ibCenter" />').appendTo(wrap)[0];
    content = $('<div id="ibContent" />').appendTo(center).append([
        responsive = $('<div id="ibResponsive" />').append([
            bgImage = $('<div id="ibBgImage" />')[0],
            image = $('<div id="ibImage" />')[0],
            prev = $('<div id="ibPrev" class="ibScrim ibScrim-left ibScrim-20"><i class="ib-icon-prev"></i></div>').on('click', prevImage)[0],
            next = $('<div id="ibNext" class="ibScrim ibScrim-right ibScrim-20"><i class="ib-icon-next"></i></div>').on('click', nextImage)[0]
        ])[0],
        bottomContainer = $('<div id="ibBottomContainer" />')[0],
    ])[0];
    bottom = $('<div id="ibBottom" />').appendTo(bottomContainer).append([
        close = $('<a id="ibCloseLink" href="#" ><span id="ibCloseText"></span><i class="ib-icon-close"></i></a>').click($.ibClose)[0],
        counter = $('<small id="ibCounter" />')[0],
        caption = $('<strong id="ibCaption" />')[0]
    ])[0];
    closeText = $(bottom).find('#ibCloseText')[0];
    $(img).on('load', showImage);
    win.on("resize", function () {
        if (activeImage)
            setMaxWidth(getMaxSize(img.width, img.height, false).width);
    });
    var r = $(".mdl-layout.mdl-js-layout")[0];
    if (!r)
        r = $("body")[0];
    $("a[rel^='lightbox']").imagebox({
        root: r
    }, null, function (el) {
        return (this == el) || ((this.getAttribute('rel').length > 8) && (this.getAttribute('rel') == el.getAttribute('rel')));
    });
})(jQuery);
