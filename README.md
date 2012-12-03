SMIL_Player
===========

The intent of this is to create a Javascript class that will parse SMIL, particularly the [A-SMIL](http://www.a-smil.org/) variant used by [IAdea](http://www.iadea.com/technology/smil) for Digital Signage, so that a browser - I am targeting Chrome - can be a Digital Signage Player.

The player will transform the SMIL to HTML5 elements in the body of the page.

Known limitations at this time:
- since it uses XMLHttpRequest to get the SMIL file, it has the same restrictions
- - cannot launch using file:/// protocol
- - if requesting the SMIL from another domain, must follow CORS
- exclusive (programable) playlist is not supported yet
- packaged widgets are not supported yet, but are if they are unzipped
- wallclock and various begin/end times and events are not yet implemented
- prefetching not supported yet
- while the pull method is used, refreshing is not supported yet
- fit values are not supported yet, uses the fill method currently
- none of the "adapi:" extensions are supported (yet)