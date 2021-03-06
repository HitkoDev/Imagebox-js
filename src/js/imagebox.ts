/// <reference path="jquery.d.ts" />

interface ibOptions {
    initialSize?: number,
    lang?: {
        close?: string,
        prev?: string,
        next?: string,
        counter?: string
    },
    padding?: number,
    closeKeys?: Array<number>,
    prevKeys?: Array<number>,
    nextKeys?: Array<number>,
    doubleClickTimeout?: number,
    loop?: boolean,
    root?: HTMLElement,
    animation?: {
        duration?: number,
        iterations?: number,
        delay?: number,
        easing?: string
    }
}

interface ibImage {
    url: string,
    title: string,
    index: number,
    origin?: ibOrigin
}

interface ibOrigin {
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    target: HTMLElement
}

interface ibSize {
    width: number,
    height: number
}

interface JQuery {
    imagebox(_options: ibOptions, linkMapper?: (el: HTMLElement, i: number) => ibImage, linksFilter?: (el: HTMLElement, i: number) => boolean): JQuery;
}

interface JQueryStatic {
    imagebox(_images: Array<ibImage>, startImage: number, _options: ibOptions): boolean;
    ibClose(): boolean;
}

interface webAnimation {
    addEventListener(event: string, callback: Function): void,
    cancel(): void,
}

interface HTMLDivElement {
    animate(a: any, b: any): webAnimation
}

(function($: JQueryStatic) {

    var
        overlay: HTMLDivElement,
        wrap: HTMLDivElement,
        center: HTMLDivElement,
        content: HTMLDivElement,
        responsive: HTMLDivElement,
        bgImage: HTMLDivElement,
        image: HTMLDivElement,
        prev: HTMLDivElement,
        next: HTMLDivElement,
        bottomContainer: HTMLDivElement,
        bottom: HTMLDivElement,
        close: HTMLLinkElement,
        counter: HTMLElement,
        caption: HTMLElement,
        closeText: HTMLSpanElement,

        img: HTMLImageElement = new Image(),
        preloadP: HTMLImageElement = new Image(),
        preloadN: HTMLImageElement = new Image(),

        images: Array<ibImage> = [],
        win = $(window),
        options: ibOptions = {},
        activeImage: ibImage,
        changing: boolean = false,
        open: boolean = false,
        queued: number = -1,
        animations: Array<webAnimation> = [],
        timeout: number,

        defaults: ibOptions = {
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

    $.fn.imagebox = function(_options: ibOptions, linkMapper?: (el: HTMLElement, i: number) => ibImage, linksFilter?: (el: HTMLElement, i: number) => boolean) {
        linkMapper = linkMapper || function(el: HTMLElement, i: number): ibImage {
            var im: ibImage = {
                url: el.getAttribute("href") || undefined,
                title: el.getAttribute("title") || undefined,
                index: i
            };
            return im;
        };
        linksFilter = linksFilter || function(el: HTMLElement, i: number): boolean {
            return true;
        };

        var links = this;

        return links.unbind("click").click(function(evt) {

            var link = this,
                startIndex: number = 0,
                filteredLinks: Array<ibImage> = [];

            for (var i = 0; i < links.length; i++) {
                if (linksFilter.call(link, links[i], i)) {
                    if (links[i] == link) startIndex = i;
                }
                filteredLinks.push(linkMapper(links[i], i));
            }

            filteredLinks[startIndex].origin = {
                target: link
            };

            return $.imagebox(filteredLinks, startIndex, _options);
        });

    }

    $.imagebox = function(_images: Array<ibImage>, startImage: number, _options: ibOptions) {
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

    $.ibClose = function(): boolean {
        stop();
        $([wrap, bottomContainer, overlay]).toggleClass('visible', false);
        $(wrap).toggleClass('animating', false);
        if (activeImage) activeImage = undefined;
        $(document).off("keydown", keyDown);
        return false;
    }

    function changeImage(i: number) {
        if (i < 0 || i >= images.length) return false;

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
        $(center).css(centerTarget);
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
        setBoxPosition(options.root);
    }

    function showImage(): boolean {
        if (!open) return false;

        var px = prevIndex(), nx = nextIndex();
        if (px >= 0) {
            $(prev).show();
            preloadP.src = images[px].url;
        } else {
            $(prev).hide();
        }
        if (nx >= 0) {
            $(next).show();
            preloadN.src = images[nx].url;
        } else {
            $(next).hide();
        }

        $(image).css({
            'background-image': "url('" + img.src + "')",
            'opacity': 0
        });

        setBoxPosition(options.root);

        var anim: webAnimation = image.animate([{
            opacity: 0
        }, {
                opacity: 1
            }], options.animation);
        $(image).css('opacity', 1);
        anim.addEventListener('finish', function() {
            $(bgImage).toggleClass('loading', false);
            $(bgImage).css('background-image', "url('" + img.src + "')");
        });
        animations.push(anim);

        setMaxWidth(getMaxSize(img.width, img.height, true).width, function() {
            var anim = bottomContainer.animate([
                { 'max-height': '0px' },
                { 'max-height': '200px' }
            ], options.animation);
            $(bottomContainer).toggleClass('visible', true);
            anim.addEventListener('finish', function() {
                if (queued != activeImage.index && timeout < 0) {
                    changeImage(queued);
                } else {
                    changing = false;
                    $(wrap).toggleClass('animating', false);
                }
            });
            animations.push(anim);
        });

        return false;
    }

    function prevImage(): boolean {
        queued = prevIndex();
        if (queued < 0) queued = 0;
        queueChange();
        return false;
    }

    function nextImage(): boolean {
        queued = nextIndex();
        if (queued < 0) queued = images.length - 1;
        queueChange();
        return false;
    }

    function queueChange() {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = -1;
            if (!changing && queued != activeImage.index) changeImage(queued);
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
        for (var i = 0; i < animations.length; i++) animations[i].cancel();
        animations = [];
    }

    function getMaxSize(width: number, height: number, animate: boolean): ibSize {
        var iw = width, ih = height;

        if (width + 2 * options.padding > $(wrap).innerWidth()) width = $(wrap).innerWidth() - 2 * options.padding;
        height = (ih * width) / iw;
        if (height + 2 * options.padding > $(wrap).innerHeight()) height = $(wrap).innerHeight() - 2 * options.padding;
        width = (height * iw) / ih;

        var ratio = (height * 100) / width;
        var target = {
            'padding-bottom': ratio + '%'
        };
        if (animate) {
            var origin = {
                'padding-bottom': $(responsive).css('padding-bottom')
            };
            var anim: webAnimation = responsive.animate([
                origin, target
            ], options.animation);
            $(responsive).css(target);
            animations.push(anim);
        } else {
            $(responsive).css(target);
        }

        return {
            width: width,
            height: height
        };
    }

    function setMaxWidth(width: number, callback?: () => any) {
        width += 2 * options.padding;
        var anim = center.animate([{
            'max-width': $(center).css('max-width')
        }, {
                'max-width': width + 'px'
            }], options.animation);
        $(center).css('max-width', width);
        anim.addEventListener('finish', function() {
            if (typeof callback == 'function') callback();
        });
        animations.push(anim);
    }

    function setBoxPosition(root): void {
        var pos = $(wrap).position();
        var rect = $(wrap).offset();
        var bdy = $('html').offset();
        if ($(root)[0] != $('body')[0]) {
            pos.top += $(root).scrollTop();
            pos.left += $(root).scrollLeft();
        }
        $(wrap).css({
            top: pos.top + bdy.top + window.scrollY - rect.top,
            left: pos.left + bdy.left + window.scrollX - rect.left
        });
    }

    $(window).on('load', function() {
        $(defaults.root).append(
            $([
                overlay = <HTMLDivElement>$('<div id="ibOverlay" />').click($.ibClose)[0],
                wrap = <HTMLDivElement>$('<div id="ibWrap" />')[0]
            ])
        );
        center = <HTMLDivElement>$('<div id="ibCenter" />').appendTo(wrap)[0];
        content = <HTMLDivElement>$('<div id="ibContent" />').appendTo(center).append([
            responsive = <HTMLDivElement>$('<div id="ibResponsive" />').append([
                bgImage = <HTMLDivElement>$('<div id="ibBgImage" />')[0],
                image = <HTMLDivElement>$('<div id="ibImage" />')[0],
                prev = <HTMLDivElement>$('<div id="ibPrev" class="ibScrim ibScrim-left ibScrim-20"><i class="ib-icon-prev"></i></div>').on('click', prevImage)[0],
                next = <HTMLDivElement>$('<div id="ibNext" class="ibScrim ibScrim-right ibScrim-20"><i class="ib-icon-next"></i></div>').on('click', nextImage)[0]
            ])[0],
            bottomContainer = <HTMLDivElement>$('<div id="ibBottomContainer" />')[0],
        ])[0];
        bottom = <HTMLDivElement>$('<div id="ibBottom" />').appendTo(bottomContainer).append([
            close = <HTMLLinkElement>$('<a id="ibCloseLink" href="#" ><span id="ibCloseText"></span><i class="ib-icon-close"></i></a>').click($.ibClose)[0],
            counter = $('<small id="ibCounter" />')[0],
            caption = $('<strong id="ibCaption" />')[0]
        ])[0];
        closeText = $(bottom).find('#ibCloseText')[0];
        $(img).on('load', showImage);

        win.on("resize", function() {
            if (activeImage) setMaxWidth(getMaxSize(img.width, img.height, false).width);
        });

        var r = $(".mdl-layout.mdl-js-layout")[0];
        if (!r) r = $("body")[0];

        $("a[rel^='lightbox']").imagebox({
            root: r
        }, null, function(el) {
            return (this == el) || ((this.getAttribute('rel').length > 8) && (this.getAttribute('rel') == el.getAttribute('rel')));
        });
    });

})(jQuery);