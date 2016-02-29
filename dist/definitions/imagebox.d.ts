/// <reference path="jquery.d.ts" />
interface ibOptions {
    initialSize?: number;
    lang?: {
        close?: string;
        prev?: string;
        next?: string;
        counter?: string;
    };
    padding?: number;
    closeKeys?: Array<number>;
    prevKeys?: Array<number>;
    nextKeys?: Array<number>;
    doubleClickTimeout?: number;
    loop?: boolean;
    root?: HTMLElement;
    animation?: {
        duration?: number;
        iterations?: number;
        delay?: number;
        easing?: string;
    };
}
interface ibImage {
    url: string;
    title: string;
    index: number;
}
interface ibOrigin {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface ibSize {
    width: number;
    height: number;
}
interface JQuery {
    imagebox(_options: ibOptions, linkMapper?: (el: HTMLElement, i: number) => ibImage, linksFilter?: (el: HTMLElement, i: number) => boolean): JQuery;
}
interface JQueryStatic {
    imagebox(_images: Array<ibImage>, startImage: number, _options: ibOptions, origin: ibOrigin): boolean;
    ibClose(): boolean;
}
interface webAnimation {
    addEventListener(event: string, callback: Function): void;
    cancel(): void;
}
interface HTMLDivElement {
    animate(a: any, b: any): webAnimation;
}
