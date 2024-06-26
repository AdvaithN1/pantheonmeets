"use strict";
function magicMouse(e) {
    if ((e = e || {}).outerWidth = e.outerWidth || 30,
    e.outerHeight = e.outerHeight || 30,
    e.cursorOuter = e.cursorOuter || "circle-basic",
    e.hoverEffect = e.hoverEffect || "circle-move",
    e.hoverItemMove = e.hoverItemMove || !1,
    e.defaultCursor = e.defaultCursor || !1,
    "disable" != e.cursorOuter) {
        var t = document.createElement("div");
        t.setAttribute("id", "magicMouseCursor"),
        document.body.appendChild(t);
        var r = document.getElementById("magicMouseCursor")
    }
    if (!e.defaultCursor) {
        document.body.style.cursor = "none";
        var s = document.createElement("div");
        s.setAttribute("id", "magicPointer"),
        document.body.appendChild(s);
        var o = document.getElementById("magicPointer")
    }
    if (r) {
        r.style.width = e.outerWidth + "px",
        r.style.height = e.outerHeight + "px";
        var i = e.outerWidth
          , a = e.outerHeight
          , n = e.outerWidth
          , c = e.outerHeight
    }
    var u = 0
      , d = 0
      , l = 0
      , m = 0
      , h = !1;
    document.addEventListener("mousemove", (function(e) {
        l = e.clientX,
        m = e.clientY,
        h || (u = e.clientX - i / 2,
        d = e.clientY - a / 2)
    }
    )),
    document.querySelectorAll(".magic-hover").forEach((t,r)=>{
        t.addEventListener("mouseenter", r=>{
            switch (e.hoverEffect) {
            case "circle-move":
                f(t),
                e.hoverItemMove && b(r, t);
                break;
            case "pointer-blur":
                y(t, "pointer-blur");
                break;
            case "pointer-overlay":
                y(t, "pointer-overlay")
            }
        }
        ),
        t.addEventListener("mouseleave", r=>{
            switch (t.style.transform = "translate3d(0,0,0)",
            e.hoverEffect) {
            case "circle-move":
                g();
                break;
            case "pointer-blur":
                p("pointer-blur");
                break;
            case "pointer-overlay":
                p("pointer-overlay")
            }
        }
        )
    }
    );
    var v = ()=>{
        r && (r.style.transform = "matrix(1, 0, 0, 1, " + u + ", " + d + ")",
        r.style.width = i + "px",
        r.style.height = a + "px"),
        o && (o.style.transform = "matrix(1, 0, 0, 1, " + l + ", " + m + ") translate3d(-50%, -50%, 0)"),
        requestAnimationFrame(v)
    }
    ;
    requestAnimationFrame(v);
    const f = e=>{
        if (h = !0,
        r) {
            r.style.transition = "transform 0.2s, width 0.3s, height 0.3s, border-radius 0.2s",
            r.classList.add("is-hover")
            var target = event.currentTarget;
            var t = event.currentTarget.getBoundingClientRect();
            e.classList.contains("magic-hover__square") ? (r.classList.add("cursor-square"),
            u = t.left,
            d = t.top,
            i = t.width,
            o.style.width = '40px',
            o.style.height = '40px',
            a = t.height,
            r.style.borderRadius = (parseInt(window.getComputedStyle(target).borderRadius.replace('px','')) + 1 + parseInt(window.getComputedStyle(target).borderWidth.replace('px',''))) + 'px') : (u = t.left,
            d = t.top,
            o.style.width = '40px',
            o.style.height = '40px',
            i = t.width,
            a = t.height,
            r.style.borderRadius = (parseInt(window.getComputedStyle(target).borderRadius.replace('px','')) + 1 + parseInt(window.getComputedStyle(target).borderWidth.replace('px',''))) + 'px')
        }
        o && o.classList.add("is-hover")
    }
      , g = ()=>{
        h = !1,
        r && (i = n,
        a = c,
        r.style.transition = "transform 0.07s, width 0.3s, height 0.3s, border-radius 0.2s",
        r.classList.remove("cursor-square"),
        o.style.width = '5px',
        o.style.height = '5px',
        r.style.borderRadius = 50 + "%",
        r.classList.remove("is-hover")),
        o && o.classList.remove("is-hover")
    }
      , y = (e,t)=>{
        o && o.classList.add(t)
    }
      , p = e=>{
        o && o.classList.remove(e)
    }
      , b = (e,t)=>{
        e.clientX,
        e.clientY,
        t.addEventListener("mousemove", e=>{
            t.style.transform = "matrix(1,0,0,1," + (e.offsetX - e.target.offsetWidth / 2) / 2 + ", " + (e.offsetY - e.target.offsetHeight / 2) / 2 + ")"
        }
        )
    }
}
