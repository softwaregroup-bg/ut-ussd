ALTER PROCEDURE [ussd].[audit.add]
    @ussdAudit [ussd].[auditTT] READONLY
AS
BEGIN
    -- Ensure atomicity and error handling
    BEGIN TRY
        -- Insert rows from the table-valued parameter
        INSERT INTO [ussd].[audit] (
            ussdBody,
            msg,
            phoneNumber,
            sessionId,
            timeTakenMS,
            requestDateTime,
            responseDateTime,
            isError,
            traceNo,
            error
        )
        SELECT
            ussdBody,
            msg,
            phoneNumber,
            sessionId,
            timeTakenMS,
            requestDateTime,
            responseDateTime,
            isError,
            traceNo,
            error
        FROM @ussdAudit;

    END TRY
    BEGIN CATCH
        -- Handle errors
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
