# Step by step guide to write a counter program in PyTeal 🐍

The following tutorial will help you build a Pyteal Smart Contract that allows users to set, increment, decrement and query the value of a counter.

---

### _Prerequisites:_

- Development Environment Setup, you can use following documentation [here.](https://github.com/clooneyr/AlgorandTutorialLibrary/blob/main/envSetup.md).

---

## Contract Building.

import pyteal:

```
from pyteal import *
```

Define the main function (contract), it can be called whatever you like, for tutorial purposes we will use approval_program:

```
def approval_program():
```
The fist function we will create within the contract is on_create which includes all the necessary logic for when the contract is first initialised.

Here all we are doing, is assigning two things to global memory using key pairs, first "owner" is paired with the sender of the contract. Then we are creating a variable "Counter" and assigning 0 to it:

_note: Approve() is apart of teal version 5, it is the same as using Return(Int(1))

```
on_create = Seq([
    App.globalPut(Bytes("owner"), Txn.sender()),
    App.globalPut(Bytes("Counter"), Int(0)),
    Approve(),
])

```

Now we are simply assigning is_owner to check if the current sender has the same address as the initial creator (owner):
_This will be used later on

```
is_owner = Txn.sender() == App.globalGet(Bytes("owner"))
```

For the following functions where we are updating the value of the counter, we can utilise [scatch space](https://pyteal.readthedocs.io/en/latest/scratch.html) to handle the necessary logic.

todo this we first must declare the scatchspace in our contract with the type of unint64:

```
scratchCount = ScratchVar(TealType.uint64)
```
Now we are ready to build the addition function, all it does is get the current state of "Counter" and stores it in the scratch space.
Then we are updating the "Counter" value with [App.globalPut](https://pyteal.readthedocs.io/en/stable/state.html) this works by first stating which key we want to write to, and then assining the new value which in our case is +1:
```
addition = Seq([
        scratchCount.store(App.globalGet(Bytes("Counter"))), 
        App.globalPut(Bytes("Counter"), scratchCount.load() + Int(1)), 
        Approve(),
    ])
```

The subtraction function works almost identically, however it has a check to ensure the current value of the "counter" is greater than 0:
```
 subtraction = Seq([
        scratchCount.store(App.globalGet(Bytes("Counter"))), 
        If(scratchCount.load() > Int(0),
            App.globalPut(Bytes("Counter"), scratchCount.load() - Int(1)), 
        ),
        Approve(),
   ])
```
To interact with contracts on algorand, we need to pass arguments which can be used to trigger a function.
This is fairly simply as we can use a condition to check if the argument passed matches our defined keys which we link to the functions we have made above: 

```
on_call_method = Txn.application_args[0]
    on_call = Cond(
        [on_call_method == Bytes("minus"), subtraction],
        [on_call_method == Bytes("add"), addition],
        
    )
```

This following part can be considered as the heart of the contract as it handles all of the transactions made to the application (smart contract).

When an application is first made its ID is always 0, so our first condition uses this to direct to our on_create function.
Then the rest handles all of the transaction calls that can be made, the most important is .NoOp, when a call is made to the application, our on_call function is triggered which is then used to decide what the call to the transaction was for. For example to make an addition to the counter.

```
program = Cond(
    [Txn.application_id() == Int(0), on_create],
    [Txn.on_completion() == OnComplete.NoOp, on_call],
    [Txn.on_completion() == OnComplete.OptIn, Approve()],
    [Txn.on_completion() == OnComplete.CloseOut, Approve()],
    [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_owner)],
    [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_owner)],
)
return program
```

Next we just define our clear program, which just consists of approving it:
```
def clear_state_program():
    return Approve()
```

The following is used to convert our pyteal code into TEAL:
```
if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)
```

Now run your smart contract using:

```
python <filename>
```

---

