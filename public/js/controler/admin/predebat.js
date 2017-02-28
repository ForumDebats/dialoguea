/**
 * Date: <2014-12-01 16:29:44>
 * DialogueA
 * philippe.estival@enov-formation.com
 *
 * dialogue.js
 * dialogue section controller
 */

var PreDebatCtrl = ['Docu','Cmt','Debat','$resource','$stateParams','$sce','$window','$scope','$rootScope',
function(Docu,Cmt,Debat,$resource,$stateParams,$sce,$window,$scope,$rootScope) {

    var P = this;
    P.errmsg='';
    P.doc=null;
    P.htmld=null;

    Docu.get( {id: $stateParams.docId}, function(doc) {
        P.doc = doc;
        P.htmld= $sce.trustAsHtml(doc.texte)
        //Group.get({id:$rootScope.GrpSelection})
        $scope.groupsAr = _.values($rootScope.GrpSelection)
        $scope.groups = $scope.groupsAr.join(', ');
    });

    this.openDebat=function() {
        doc = P.doc
        var rootCmt = new Cmt({
            citation:      $sce.trustAsHtml(doc.titre1).toString(),
            reformulation: $sce.trustAsHtml(doc.titre2).toString(),
            argumentation: $sce.trustAsHtml(doc.texte).toString(),
            avis: 4,
            selection: {},
            uid:$rootScope.user.uid
        })

        rootCmt.$save()
        .then(function (r) {
            var debat = new Debat({
                titre : doc.titre1+", "+ doc.titre2,
                categorie: [doc.categorie],
                gids: _.keys($rootScope.GrpSelection),
                rootCmt : r._id,
                responsable : $rootScope.user.uid
            })

            debat.$save()
                    .then(function (d) {
                        $window.location.href = "/#/debat/"+d._id
                        // $state.go
                    })
                    .catch(function (req) {
                        P.errmsg = req.data
                    })

                //$state.go('catDocList',{catId:cid})
            })
            .catch(function(req) {
                P.errmsg = req.data
            })
    }
}]

