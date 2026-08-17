## Introduction about Operating System

# Application Software
    Application software performed specific tasks for the user.
# System Software
    System software operates and control the system resources and provide a platform to run application software.

Let's discuss why do we need the OS, and then we can define ?
    Suppose we have system resources like CPU, MEMORY, GPU let's take this only
    and we have to run an application software for example - PUBG (this is a game which is very heavy and needs high computational powers)
    Now .. PUBG will come and there is no layer btw resources and Application software 
    then PUBG aquire all the resources and run smoothly
    After some time, you have decide to give some time to open instagram ( another application software )
    but PUBG acquired the resources, what will you offer to instagram there is no resource the application won't even open and crashed because it won't get any resource to run the application

    Then we decided, for every application we have to make sure that every application have their own memory and resource management
    
    (PUBG)                         (INSTAGRAM)        ....................   (Nth Application )
        - Memory Management             - Memory Management                         - Memory Management
        - Resource Management           - Resource Management                       - Resource Management


    In software, we have a PRINCIPLE known as *DRY* Don't repeat yourself, but here we do it for every application.

    Here, we know we need some mediator btw the application software and hardware, which will do efficient resource and memory management.


The mediator, we are talking about is the OS,

## Operating system is a piece of software which sits between the hardware and application software, allows the application software an environment where it can run its logic by hiding the underlying complexity btw the hardware resources.


Functions of the OS
    - It is the interface between the hardware and software (application)
    - It manages the system resources and memory to give efficiency.
    - It hides the complexity of the hardware and allocate an area where software can run.
    - Resources and Memory like ( CPU, RAM, ROM , FILES (I/O) and many more).


    USER <----------------- > [ Operating System ] <---------------------> Hardware 

Let's discuss the Types of OS.

Before learning the types let's discuss the goals of the OS:
    - Maximum CPU Utilization -
    - Less Process Starvation
    - Higher priority job execution


Now disuss the types of the OS, by keeping this goals in mind.
## Types of OS
    -> Single Processing Unit - This OS process the tasks sequentially.
        Suppose we have 3 processes, P1, P2 and P3
        P1 ---->          |----|
        P2 ------>        | OS | ----> P2 executes .... takes time ........ P1 AND P3 gets waited until it finishes 
        P3 ---->          |----|

        No CPU Utilization, Process Starvation and NO Higher priority job execution

    -> Batch Processing Unit - This OS takes the process and there is an operator which basically sort them in batch way
        Suppose we have 7 processes, P1, P2, P3, .... P7
        P1 ---->          |----|
        P2 ------>        | OS | ----> P2 executes .... takes time ........ P1 AND P3 gets waited until it finishes 
        .. ---->          |    |
        P7 ---->          |----|   