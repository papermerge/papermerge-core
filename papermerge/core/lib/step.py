class Step:
    # Q: What is ``Step`` and why it was a bad decision to introduce it?
    #
    # A: ``Step`` class is closely related to zooming in/zooming out
    # a specific page in the document in the frontend (javascript code).
    #
    # When user opens the document in document viewer, he/she actually
    # sees an image with text over it (text overlay). Text overlay is
    # created from hocr data. Very important point here, is that
    # text hocr data corresponds to (extracted, format jpeg) image of the page
    # of VERY SAME width/height. Again, hocr file and respective image file
    # of the page MUST HAVE SAME WIDTH AND HEIGHT.
    #
    # Each step is meant to be a specific zoom value of the page. Thus, step
    # 2, which corresonds to LIST[2] % = 75 % of the page initial logical size
    # of WIDTH_100p = 1240.
    # When user zooms in/zooms out - a new hocr file is downloaded
    # corresponding to that zoom step. As you may guess, user can zoom only
    # 125%, 100%, 75% and 50%. Value of 10% corresponds to thumbnail of the
    # document and does not count as 'real' step.
    #
    # Instead of doing this step thingy, it would have been better to drop
    # the entire step concept. Much better solution for zoom in/zoom out would
    # have been to download one SVG file for each page (instead of hocr) and
    # SVG file of respective page should contain embedded image
    # (binary jpeg; yes SVG format allows embedding of binary formats!) and
    # correctly mapped text overlay (built from hocr file). User later
    #  can zoom in/zoom out using SVG transforations in frontend!
    #
    # The good things about SVG solutions are:
    #
    # * there will be 4X less OCR required (corresponding to
    #     hOCR of each step minus thumbnail/10% step)
    # * will simplify front-end code as SVG (= hocr + jpeg) will be
    #       generated on the on server side
    # * eliminate conept of Step entirely
    #    (there will be only one SVG file per page)
    # * increase front-end and back-end performance as only one file SVG file
    #   will be sent back and forth (from backend to frontend)
    #
    # width of a document when displayed as 100%.
    WIDTH_100p = 1240
    PERCENT = 100
    LIST = [125, 100, 75, 50, 10]

    # aspect ration for A4 paper is h = w * 1.41
    # for 100
    # 100 => w = 1240, h = 1748
    # 50  => w = 620, h = 874

    def __init__(self, current=1):
        self.current = current

    @property
    def width(self):
        p = self.percent / 100
        return int(p * Step.WIDTH_100p)

    @property
    def is_thumbnail(self):
        return self.percent < 50

    @property
    def is_for_hocr(self):
        return not self.is_thumbnail

    @property
    def percent(self):
        return Step.LIST[self.current]

    def __str__(self):
        return f"Step(percent={self.percent}, width={self.width})"

    def __repr__(self):
        return self.__str__()


class Steps:
    def __init__(self):
        self.steps = [Step(0), Step(1), Step(2), Step(3), Step(4)]

    def __iter__(self):
        return iter(self.steps)
