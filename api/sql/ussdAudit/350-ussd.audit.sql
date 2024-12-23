CREATE TABLE [ussd].[audit](
    auditId BIGINT IDENTITY(1000, 1) NOT NULL,
    ussdBody NVARCHAR(550),
    msg NVARCHAR(500),
    phoneNumber NVARCHAR(15),
    sessionId NVARCHAR(50),
    timeTakenMS NVARCHAR(10),
    requestDateTime DATETIME,
    responseDateTime DATETIME,
    isError BIT,
    traceNo NVARCHAR(55),
    error NVARCHAR(1500)
)
