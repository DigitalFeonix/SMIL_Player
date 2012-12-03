function SMIL_Player(src)
{
    this.src = src;
    this.smil;
    this.playlist;
    var base;
    
    function _dirname(path)
    {
        // http://kevin.vanzonneveld.net
        // +   original by: Ozh
        // +   improved by: XoraX (http://www.xorax.info)
        // *     example 1: dirname('/etc/passwd');
        // *     returns 1: '/etc'
        // *     example 2: dirname('c:/Temp/x');
        // *     returns 2: 'c:/Temp'
        // *     example 3: dirname('/dir/test/');
        // *     returns 3: '/dir'
        return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
    }

    function _timecountToMS(string)
    {
        // ms   = milliseconds
        // s    = seconds
        // min  = minutes
        // h    = hours
        // no suffix = seconds

        var suffixes = ['ms','s','min','h'];
        var factors  = [1,1000,(60*1000),(60*60*1000)];

        var ms = false;

        for (var i = 0; i < suffixes.length; i++)
        {
            var n = string.indexOf(suffixes[i]);

            if (n != -1)
            {
                ms = string.substr(0,n) * factors[i];

                break;
            }
        }

        return Math.ceil(ms);
    }


    function _getSMIL(url)
    {
        base = (url.indexOf('/') == -1) ? '' : _dirname(url) + '/';

        var xhr = new XMLHttpRequest();
        var ret = false;
    
        xhr.open('GET', url, false);
        xhr.onload = function()
        {
            if (xhr.status == 200)
            {
                ret = xhr.responseXML;
            }
        }
        xhr.send(null);
        
        return ret;
    }

    function _renderLayout(layout)
    {
        // there should only be one root-layout per layout
        var rootLayout = layout.getElementsByTagName('root-layout')[0];

        var root = document.createElement('div');
        root.id = 'root';
        root.style.position = 'absolute';
        root.style.zIndex = 0;

        if (rootLayout.attributes.hasOwnProperty('width'))
        {
            document.body.style.width = root.style.width = rootLayout.getAttribute('width') + ((rootLayout.getAttribute('width').indexOf('%') == -1) ? 'px' : '');
        }

        if (rootLayout.attributes.hasOwnProperty('height'))
        {
            document.body.style.height = root.style.height = rootLayout.getAttribute('height') + ((rootLayout.getAttribute('height').indexOf('%') == -1) ? 'px' : '');
        }

        if (rootLayout.attributes.hasOwnProperty('backgroundColor'))
        {
            root.style.backgroundColor = rootLayout.getAttribute('backgroundColor');
        }

        document.body.appendChild(root);

        if (layout.childNodes.length > 1)
        {
            var region = rootLayout;

            while (region = region.nextSibling)
            {
                if (region.nodeType == 1)
                {
                    _outputRegion(region);
                }
            }
        }

    }

    function _outputRegion(region)
    {
        var div = document.createElement('div');
        var id;

        div.style.position = 'absolute';

        for (var i = 0; i < region.attributes.length; i++)
        {
            var attr = region.attributes[i];

            if (attr.name == 'xml:id' || attr.name == 'id' || attr.name == 'regionName') id = div.id = attr.value;
            if (attr.name == 'width') div.style.width = attr.value + ((attr.value.indexOf('%') == -1) ? 'px' : '');
            if (attr.name == 'height') div.style.height = attr.value + ((attr.value.indexOf('%') == -1) ? 'px' : '');
            if (attr.name == 'left') div.style.left = attr.value + ((attr.value.indexOf('%') == -1) ? 'px' : '');
            if (attr.name == 'right') div.style.right = attr.value + ((attr.value.indexOf('%') == -1) ? 'px' : '');
            if (attr.name == 'top') div.style.top = attr.value + ((attr.value.indexOf('%') == -1) ? 'px' : '');
            if (attr.name == 'bottom') div.style.bottom = attr.value + ((attr.value.indexOf('%') == -1) ? 'px' : '');
            if (attr.name == 'mediaAlign') div.style.textAlign = attr.value;
            if (attr.name == 'backgroundColor') div.style.backgroundColor = attr.value;
            if (attr.name == 'z-index') div.style.zIndex = attr.value;
        }

        if (id !== undefined)
        {
            div.innerHTML = id;
        }

        document.body.appendChild(div);
    }

    // playlists contain media or other playlists
    function Playlist()
    {
        this.duration;
        this.begin;
        this.end;
        this.repeatCount;
        this.repeatDuration;

        this.type; // seq, par, excl

        this.play = function()
        {
            for (var i = 0; i < this.members.length; i++)
            {
                if (this.members[i] instanceof Playlist)
                {
                    this.members[i].play();
                }
                else if (this.members[i] instanceof MediaObject)
                {
                    if ((this.type == 'par') || (this.type == 'seq' && i == 0))
                    {
                        this.members[i].output(this,i);
                    }
                }
            }
        };

        this.next = function(i)
        {
            console.log('next called');
            var nextItem = i+1;

            if (this.members[nextItem] == undefined)
            {
                if (this.repeatCount == 'indefinite')
                {
                    this.members[0].output(this,0);
                }
            }
            else
            {
                this.members[nextItem].output(this,nextItem);
            }
        }

        this.members = new Array();

        this.addMembers = function(arr)
        {
            this.members = this.members.concat(arr);
        }
    }

    // to be added to playlists
    function MediaObject()
    {
        this.region = 'root'; // root region by default
        this.duration;
        this.begin;
        this.end;

        this.type; // img, video, audio, ref (HTML most likely)
        this.src;
        this.fill;

        this.subtitles; // used for video types only

        this.output = function (playlist, item)
        {
            var region  = document.getElementById(this.region);
            var ele     = document.createElement(this.type);

            ele.src = this.src;

            if (this.type == 'video')
            {
                ele.autoplay = true;

                if (this.subtitles != undefined)
                {
                    var textTrack   = document.createElement('track');

                    textTrack.kind      = 'subtitles';
                    textTrack.label     = 'English subtitles';
                    textTrack.src       = this.subtitles;
                    textTrack.srclang   = 'en';
                    textTrack['default']=  true;

                    ele.appendChild(textTrack);
                }

            }

            if (this.type == 'iframe')
            {
                //ele.seamless = true;
                ele.style.overflow ='hidden';
                ele.frameborder = 0;
                ele.scrolling = 'no';
            }

            // use this.fill to determine width/height

            ele.style.width = '100%';
            ele.style.height = '100%';

            region.innerHTML = '';
            region.appendChild(ele);

            if (this.duration != undefined)
            {
                var ms = _timecountToMS(this.duration);

                if (ms !== false)
                {
                    //setTimeout('playlist.next(item)',ms);
                    setTimeout (function(p,i){p.next(i);},ms,playlist,item);
                }
            }
            else
            {
                if (this.type == 'video')
                {
                    ele.addEventListener('ended', function(){playlist.next(item)}, false);
                }
            }


            // at the end of the duration, we need to send some kind of event to the playlist
            // to play the next item on the list
        };
    }

    function playlistManager(structure)
    {
        var protoRegExp = /^[a-z]+:\/\//i
        var ret = new Array();
        var lists = structure.childNodes;

        for (var i = 0; i < lists.length; i++)
        {
            if (lists[i].nodeType == 1)
            {
                switch(lists[i].nodeName)
                {
                    case 'seq': // sequential playlist
                    case 'par': // parallel playlist

                        var list = new Playlist();

                        list.type = lists[i].nodeName;
                        list.repeatCount = lists[i].getAttribute('repeatCount');
                        list.repeatDuration = lists[i].getAttribute('repeatDuration');

                        // repeatDuration exists as well
                        // that means to repeat as many times as possible within that duration


                        list.addMembers(playlistManager(lists[i]));

                        ret.push(list);

                        break;
                    case 'excl': // exclusive playlist (based on priority, time, or other factors)
                        break;
                    case 'img': // image object
                    case 'video': // video object

                        var obj = new MediaObject();

                        obj.type = lists[i].nodeName;

                        obj.src = (protoRegExp.test(lists[i].getAttribute('src')) ? '' : base) + lists[i].getAttribute('src');
                        obj.duration = lists[i].getAttribute('dur');

                        if (lists[i].attributes.hasOwnProperty('region'))
                        {
                            obj.region = lists[i].getAttribute('region');
                        }

                        if (lists[i].attributes.hasOwnProperty('sub'))
                        {
                            obj.subtitles = lists[i].getAttribute('sub');
                        }

                        ret.push(obj);

                        break;
                    case 'ref': // referenced (something we will want in an iframe)

                        var obj = new MediaObject();

                        obj.type = 'iframe';

                        obj.src = (protoRegExp.test(lists[i].getAttribute('src')) ? '' : base) + lists[i].getAttribute('src');
                        obj.duration = lists[i].getAttribute('dur');

                        if (lists[i].attributes.hasOwnProperty('region'))
                        {
                            obj.region = lists[i].getAttribute('region');
                        }

                        ret.push(obj);

                        break;
                }
            }
        }

        return ret;
    }

    this.play = function()
    {
        this.smil = _getSMIL(this.src);

        _renderLayout(this.smil.getElementsByTagName('layout')[0]);

        this.playlist = new Playlist();
        this.playlist.addMembers(playlistManager(this.smil.getElementsByTagName('body')[0]));
        this.playlist.play();
    }
}
