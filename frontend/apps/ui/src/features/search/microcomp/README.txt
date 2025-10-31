# Microcompiler for Advanced Search

---------------------------------------------
input0: "thi"

output:

    tokens: []
    current: {
        value: "thi"
    }

    isValid: true
    hasSuggestions: false
    suggestions: []
    errors: []

---------------------------------------------
input0a: "this "

comment: notice one space at end. Without this space we are still in case "0".

output:

    tokens: [
        {
            type: "fts",
            values: ["this"]
            raw: "this"
        }
    ]

    isValid: true
    hasSuggestions: false
    suggestions: []
    errors: []

---------------------------------------------
input0b: "this    "

comment: notice four spaces at end. 
output:

    tokens: [
        {
            type: "fts",
            values: ["this"]
            raw: "this"
        }
        {
            type: "space",
            count: 3
        }
    ]

    isValid: true
    hasSuggestions: false
    suggestions: []
    errors: []

---------------------------------------------
input0b: "this    i"

output:

    tokens: [
        {
            type: "fts",
            values: ["this"]
            raw: "this"
        }
        {
            type: "space",
            count: 3
        }
    ]

    current: {
        value: "i"
    }

    isValid: true
    hasSuggestions: false
    suggestions: []
    errors: []

---------------------------------------------
input0b: "this    is"

output:

    tokens: [
        {
            type: "fts",
            values: ["this"]
            raw: "this"
        }
        {
            type: "space",
            count: 4
        }
    ]

    current: {
        value: "is"
    }

    isValid: true
    hasSuggestions: false
    suggestions: []
    errors: []


---------------------------------------------
input0b: "this    is "

comment: to be able to decide if "is" is fts token (i.e. to be able to decide what type of token is it) user needs
to either hit "space" or hit "enter"

output:

    tokens: [
        {
            type: "fts",
            values: ["this"]
            raw: "this"
        }
        {
            type: "space",
            count: 4
        },
        {
            type: "fts",
            values: ["is"]
            raw: "is"
        }
    ]

    isValid: true
    hasSuggestions: false
    suggestions: []
    errors: []

------------------------------------------
input1: "this is free text"

comment: notice here user placed just one space between the words
and thus each word was basically a "fts" string. Once by one they
were placed in same fts token.

output1: 
    tokens: [
        {
            type: "fts",
            values: ["this", "is", "free", "text"]
            raw: "this is free text"
        }
    ]

    isValid: true
    hasSuggestions: false

    suggestions: []
    errors: []

------------------------------------------
input2: "this is free text   "

comment: Notice three spaces at the end of text. When
 hitting space there will be no suggestions given to user
 (like in vscode)

output2: 
    tokens: [
        {
            type: "fts",
            values: ["this", "is", "free", "text"]
            raw: "this is free text   "
        }
    ]

    isValid: true
    hasSuggestions: false

    suggestions: []
    errors: []

------------------------------------------
input3: "this is free text   t"

comment: Once user hits a letter which matches
one or multiple suggestions - suggestions will be
shown to user (in this case "tag"). At this point
user can pick a suggestion (by navigating it with
up/down and then selecting it by pressing "tab" or "enter"
on the selection) or he can ignore the suggestion by
continuing his/her edit

output3: 
    tokens: [
        {
            type: "fts",
            values: ["this", "is", "free", "text"]
            raw: "this is free text   "
        },
        {
            type: "space",
            count: 2
        },
    ]

    current: {
        value: "t"
    }

    isValid: true
    hasSuggestions: true

    suggestions: [
        {
            type: "keywords",
            keywords: [
                "tag"
            ]
        } 
    ]
    errors: []

------------------------------------------
input3a: "this is free text   tag:"

comment: at this point user is prompted to pick either
an operator or to pick a values for the tag

output3a: 
    tokens: [
        {
            type: "fts",
            values: ["this", "is", "free", "text"]
            raw: "this is free text   "
        },
        {
            type: "space",
            count: 2
        },

    ]

    current: {
        value: "tag:"
    }

    isValid: false
    errors: [
        {
            message: "Invalid token 'tag:'",
            token: "tag:"
        }
    ]
    hasSuggestions: true

    suggestions: [
        {
            type: "operator",
            operators: [
                "all",
                "any",
                "not"
            ]
        },
        {
            type: "tag",
            filter: [],
            exclude: []
        }
    ]


------------------------------------------
input3b: "this is free text   tag:any:"

comment: at this point user is prompted to pick a value
for the tag

output3b: 
    tokens: [
        {
            type: "fts",
            values: ["this", "is", "free", "text"]
            raw: "this is free text   "
        },
        {
            type: "space",
            count: 2
        },
    ]

    current: {
        value: "tag:any"
    }

    isValid: false
    errors: [
        {
            message: "Invalid token 'tag:'",
            token: "tag:"
        }
    ]
    hasSuggestions: true

    suggestions: [
        {
            type: "tag",
            filter: [],
            exclude: []
        } 
    ]


------------------------------------------
input3c: "this is free text   tag:any:paid"
comment: at this moment user can either hit
space (to complete list of tags) or comma (to
continue entering tags for the current token) 

output3c: 
    tokens: [
        {
            type: "fts",
            values: ["this", "is", "free", "text"]
            raw: "this is free text   "
        },
        {
            type: "space",
            count: 2
        },
        {
            type: "tag",
            values: [{
                id:,fg_color:, bg_color:, name: "paid"
            }]
            operator: "any"
        }
    ]

   current: {
        value: ","
    }

    isValid: false
    errors: [
        {
            message: "Expecting token value after the comma",
            token: "tag"
        }
    ]
    hasSuggestions: true

    suggestions: [
        {
            type: "tag",
            exclude: ["paid"],
            filter: []
        } 
    ]


------------------------------------------------------
input3d: "this is free text   tag:any:paid,important"

output3d: 
    tokens: [
        {
            type: "fts",
            values: ["this", "is", "free", "text"]
            raw: "this is free text   "
        },
        {
            type: "space",
            count: 2
        },
        {
            type: "tag",
            values: [{
                id:,fg_color:, bg_color:, name: "paid"
            },
            {
                id:,fg_color:, bg_color:, name: "important"
            }
            ]
            operator: "any"
        }
    ]

    isValid: true
    errors: []
    hasSuggestions: false

    suggestions: []

---------------------------
Tags
---------------------------

tag:<operator>:<values>

operator = <empty> | all | any | not |
values = <value>,<value>,...
value = string | quaoted string if contains empty spaces 

Examples:

tag:any:important,paid,deleted,asd 
tag:all:paid,archived
tag:not:deleted,archived
tag:invoice
tag:"Important Notice"
tag:'Green Field',"Blue sky"
