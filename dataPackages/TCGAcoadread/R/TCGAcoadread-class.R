#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAcoadread <- setClass ("TCGAcoadreadClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAcoadread <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAcoadread <- function()
{
  dir <- system.file(package="TCGAcoadread", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAcoadread(SttrDataPackage(name="TCGAcoadread",
                                  matrices=data$matrices,
                                  data.frames=data$data.frames,
                                  history=data$history,
                                  manifest=data$manifest,
                                  genesets=data$genesets))

  obj

} # TCGAcoadread constructor

#----------------------------------------------------------------------------------------------------
