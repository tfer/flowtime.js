![Flowtime.js](https://github.com/tfer/flowtime.js/raw/master/assets/img/logo-black.png "Flowtime.js Logo")

## What this branche is for

* myExamples -- sandbox to explore/augment Marco's included examples


Maybe I'll submit it to PyCon as that is coming to Cleveland, (where I'm at) for the next two years!  Anyway, I need this for my own study plans so I'll keep plugging away at is.

### Design thoughts

1. go to a slash_separted-numbers format to 'fix' i.e. 'locate' or 'label', each slide
  * use ft-A, ft-B, ft-C, ... as div classes to support instead of 2D ft-section, ft-page
1. provide a separate data structure of what to take each level of the slash_separted-numbers as representing, e.g. the "Part - Chapter - Section - page" mentioned above
  * this seems the way to go as flowtime parses the section/page divs to form the computed dom that actually provides the presentation
1. have a way to work on the presentation-html separtely from the flowtime-html
  * at the moment all the div's that comprise the presentation-html are lumped in with other things in the 'body'
  * as a first step, enclosing them in \<main\> \</main\> works and does not seem to effect the current behavior
  * none of the ways I've found to import html into html have worked for me yet
  * even if I don't find a way to do the above, I still want to work with presentation-html separately, even if I have to copy/paste it in
  * "separate" will allow me to generate the presentation-html from other documents, (at least generate the slides and their titles)
  * slide content can then be added by using markdown
    * Outliner plugin's like VOom, (vim), or Emacs org mode would help
  * The book's TOC can be massaged into an input file to aid in generating the slides
 1. may need to use a js graph library, DAG's, (Directed Acyclic Graphs) would be the most natural data structure, for that you'd need linked lists
 1. as this could get quite large, it might be best to make this out of a set of interlinked 2D grid presentations
