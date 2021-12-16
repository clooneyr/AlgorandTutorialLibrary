from pyteal import *

"""
Generic pyteal contract.

This template consists of the following:
    - On_create function to initialise state values
    - Logic to check if calls are being made by owner
    - Simple example of how to implement a function with logic
    - Example function to direct calls to created functions
    - Function that facilitates the contract to be interacted with
    - Operation code to compile pyteal into TEAl
"""

#The name of the contract can be changed to whatever you like
def contract_name():
   
    """
    Change the contents within on_create function to initialize any state (Local or Global) variables or logic
    needed on creation of contract. (Remove comment once read)
    """
    on_create = Seq([
        App.globalPut(Bytes("owner"), Txn.sender()),
        App.globalPut(Bytes("Counter"), Int(0)),
        Approve(),
    ])

    """
    If contract requires restricition, following line allows you to pass is_owner to check if
    the current sender is the intial creator of the contract. (Remove comment once read)
    """
    is_owner = Txn.sender() == App.globalGet(Bytes("owner"))

    """
    In most cases you will use a Seq expression to implement logic as it allows you to chain
    multiple expressions together.

    The following example is a simple counter logic, for when this function is called, it adds
    1 to the value (Remove comment once read)
    """

    #Declaring scratchspace, with type uint64
    scratchCount = ScratchVar(TealType.uint64)

    utility_Function = Seq([
        Assert(is_owner),
        scratchCount.store(App.globalGet(Bytes("Counter"))), #putting the current value of counter in scratch space
        App.globalPut(Bytes("Counter"), scratchCount.load() + Int(1)), #then we are changing the value of counter by adding 1
        Approve(),
    ])


    """
    Logic on line (72) will redirect to this function when a call is made to the contract
    replace the logic within the Cond expression to facilitate what the call to the contract will do
     - on_call_method, is storing the first arguement passed to the contract, Txn.application_args[1]
     would be the second argument etc etc. (Remove comment once read)
    """

    on_call_method = Txn.application_args[0]
    on_call = Cond(
        [on_call_method == Bytes("arguement-passed"), utility_Function],
    )

    """
    The following can be customised to control the flow of the contract, it works exactly like 
    a switch case statement in other programming languages. (Remove comment once read)

    """
    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_owner)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_owner)],
    )

    return program

"""
The following converts the above pyteal into Teal code, just change contract_name
to whatever you have called the approval contract. (Remove comment once read)

"""
if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        compiled = compileTeal(contract_name(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)
