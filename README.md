![Flowtime.js](https://github.com/tfer/flowtime.js/raw/master/assets/img/logo-black.png "Flowtime.js Logo")

## An aside on the way I currently create the html for each 'slideshow'.  

I leave a pair of \<main\> -- \</main> tags in the html file that has the flowtime framework and configuration settings that the slideshow will need.  Those tags provide a place to paste the html that will create the slides and their content.  Doing this lets me develop that content separately in a workflow that I find easier than just writting everything out in one go using pure html.

As I often know the layout of the "grid structure" for the sections and pages I'm going to need, I start up an editor with an 'emmet' templating plugin and write and then expand an alias to give me an n x m block that will cover the layout intended.  I then delete the div's that aren't needed and save a copy.  I apply pretty printing to the buffer to get the div's spread out and may add blank lines to emphasize section groupings.  I might save a copy of this before flatening any indentation in order to prepare for the content adding step.

I now work on a copy of this file that I've given a .md extension to, adding the content for each 'slide', aka 'page', -- but I do this using **Markdown**.  I then use **Pandoc** to convert markdown to html, outputing to a file with an .html extension.  Here is the reason for flattening the div's in the step above, pandoc will just copy html elements found in markdown text if they not indented.

Now all I have to do is re-aply pretty printing to the output and copy/paste it between the \<main\> tags.

## Where I'm looking to go with this fork

As Flowtime is the closest Presentation framework I could find to what I'd like to do, I thought I give a shot at modifying it to my needs.  As it stands, Flowtime provides a two level, "Section/Page", 2-D grid layout for slides, I'd like to extend that to a lot more dimensions so that we can simulate all the "paratext" you can find in a book, e.g.
Parts, Chapters, Sections, Topic, ..., whatever.

It's often said that the human mind has a hard time imagining more than 3 dimensions, but this is only true when the axises of those dimensions are infinite, it easily handles higher dimensions with finite axises.  Let me use a analogy to demonstrate this.  Consider a physical filing system, think of each 'grouping' change as bringing in another dimension: pages - folder - file drawer - file cabinet - row of file cabinets - rows - room - another room(s) - floor - floor(s) - building ... and so on.  Dealing with multi-dimensional spaces requires that we place each added axis at 90 degrees to the already present ones, and it's hard to imagine placing that fourth one, but dealing with multi-category spaces, we only need to a chunk of space to hold each added category and provide a means of navigating them, (going back to the analogy: taxis - elevators - doors - pulling out drawers - retrieving folders...).

Flowtime has the 'overview-grid' that can be turned on to show you where you are in your presentation in terms of "Section/Page", as long as you don't have too many slides, you can see the entire layout.  This won't be possible with extra categories, while you can cram 3 category levels on a 2D guide, you have to illustrate transversing categories with some sort of "drill-in/zoom-out" animation.

### Let me provide some drawings to show what this might look like:

![New grid mockup](https://github.com/tfer/flowtime.js/raw/master/assets/img/Parts_Chp_Sec_pg.png "Overview mockup")

### In the above drawing,

I'm showing 4 levels, Part - Chapter - Section - page, (or, perhaps ...- Section - Topic).  That might be too many for the overview, also, the text would not be part of the overview as it would be too small, its just on the drawing to show what the levels might be standing for.  Notice also that there is a suggestion that we might not be seeing all of Part II.  Even if I end up using some other format, I think I'm going to need the ability to show less than the whole overview at once. 

### Now, when we need to go further,

I'm going to need the "drill-in/zoom-out" capability that I mentioned before, so how to show that in the Overview?

Say that a Topic has too many subtopics to cover on a single slide, how are we going to show "turning a corner" and running into a fresh 'marker board' on which to array the subtopic?  I think this will need some animated transition to another 'Overview display', hopefully with a hint of where we came from.

## Drawing to show a transition to two levels of Subtopics:

![Transition mockup](https://github.com/tfer/flowtime.js/raw/master/assets/img/Transition_topic2sub.png "Transition to subtopics")

### In the above drawing,

I'm showing how we might represent a transition to two more sublevels.  If this where a textbook that used dotted numbers to track each level, we would be at 1.3.1.2.2 in Part I.  Note that the tail .2.2 is shown in a kind of "drawer" pulled out of location 1.3.1 ...

This might be the way to modify the Progress Indicator.

Keyboard navigation to this spot would have been \<down\> \<down\> ... until we reached 1.3.1, then perhaps \<enter\> 4 \<down\>'s.

## Some Implementation thoughts, (after a year of no activatity)

### Motivation for this fork

Last year I submitted a talk proposal to PyOhio, a python conference in Columbus.  You can see some of the materials I was developing for it in my "PyOhio 2015 talk" repo.  It soon became apparent that none of the presentation tools could do what I needed, i.e. navigate around in a slideshow fashion in a document that duplicated all the parts of the book I'd choosen to use as an example for the talk, "Fluent Python".

Well the conference is coming up again and I'm thinking of resubmitting the talk, but I'd need to get going on this fork!, and there is the complication that javascript is not where I spend a lot of time.

### A way forward

As time is short before PyOhio 2016, and not knowing the code I and what changes I'll want to make, I think it's best to ignore the form of the Progress Indicator for now and just create the slides I'll need for the presentation, making new slideshows every time I need to desend into levels below the top Part/Chapter slideshow.  

### Design thoughts

1. go to a dotted-numbers format to 'fix' i.e. 'locate' or 'label', each slide
1. provide a separate data structure of what to take each level of the dotted-numbers-format as representing, e.g. the "Part - Chapter - Section - page" mentioned above
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
