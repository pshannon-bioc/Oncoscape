default:  testPatientHistory testSttrDataPackage testDEMOdz testTCGAgbm testTCGAlgg testTCGAbrain

test: testPatientHistory testSttrDataPackage testDEMOdz testTCGAlgg testTCGAgbm testTCGAbrain

installAndTest: updatePackages testPackages

# testiDEMOdz: this target not automatic until we have a permanent installation

testPatientHistory:
	svn up PatientHistory
	R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
	R --vanilla -f PatientHistory/inst/unitTests/test_PatientHistory.R

testSttrDataPackage:
	svn up SttrDataPackage
	R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
	R --vanilla -f SttrDataPackage/inst/unitTests/test_SttrDataPackage.R

testDEMOdz:
	svn up DEMOdz
	R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
	R --vanilla -f DEMOdz/inst/unitTests/test_DEMOdz.R

testTCGAgbm:
	svn up TCGAgbm
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
	R --vanilla -f TCGAgbm/inst/unitTests/test_TCGAgbm.R

testTCGAlgg:
	svn up TCGAlgg
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
	R --vanilla -f TCGAlgg/inst/unitTests/test_TCGAlgg.R

testTCGAbrain:
	svn up TCGAbrain
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
	R --vanilla -f TCGAbrain/inst/unitTests/test_TCGAbrain.R

updatePackages:
	svn up PatientHistory
	R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
	svn up SttrDataPackage
	R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
	svn up DEMOdz
	R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
	svn up TCGAlgg
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
	svn up TCGAgbm
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
	svn up TCGAbrain
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
	
testPackages:
	R --vanilla -f PatientHistory/inst/unitTests/test_PatientHistory.R
	R --vanilla -f SttrDataPackage/inst/unitTests/test_SttrDataPackage.R
	R --vanilla -f TCGAlgg/inst/unitTests/test_TCGAlgg.R
	R --vanilla -f TCGAgbm/inst/unitTests/test_TCGAgbm.R
	R --vanilla -f TCGAbrain/inst/unitTests/test_TCGAbrain.R
	
noSVNall:
	R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
	R --vanilla -f PatientHistory/inst/unitTests/test_PatientHistory.R
	R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
	R --vanilla -f SttrDataPackage/inst/unitTests/test_SttrDataPackage.R
	R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
	R --vanilla -f DEMOdz/inst/unitTests/test_DEMOdz.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
	R --vanilla -f TCGAgbm/inst/unitTests/test_TCGAgbm.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
	R --vanilla -f TCGAlgg/inst/unitTests/test_TCGAlgg.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
	R --vanilla -f TCGAbrain/inst/unitTests/test_TCGAbrain.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoadread
	R --vanilla -f TCGAcoadread/inst/unitTests/test_TCGAcoadread.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlusc
	R --vanilla -f TCGAlusc/inst/unitTests/test_TCGAlusc.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAluad
	R --vanilla -f TCGAluad/inst/unitTests/test_TCGAluad.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlung
	R --vanilla -f TCGAlung/inst/unitTests/test_TCGAlung.R
