'''
Created on Dec 26, 2015

@author: mike
'''

class EPUBItem(object):
    '''
    classdocs
    '''


    def __init__(self, id, href, mimetype):
        '''
        Constructor
        '''
        self.id = id
        self.href = href
        self.mimetype = mimetype
        self.children = None