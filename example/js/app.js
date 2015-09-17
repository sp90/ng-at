/*
 Ng-app
*/

(function() {
    'use strict';

    function Config($locationProvider, $stateProvider, $urlRouterProvider) {
         
        $locationProvider.html5Mode(true);

        $stateProvider
            .state('index', {
                url: '/', 
                templateUrl: 'partials/start.html', 
                controller: 'StartController',
                controllerAs: 'vm'
            }); 

        $urlRouterProvider 
            .otherwise("/");
    }

    angular
        .module('app',[
            'ui.router',
            'ngAt',
            'controller.start',
            'directive.mention'
        ])
        .config(['$locationProvider','$stateProvider','$urlRouterProvider', Config]);

})();   

(function() {
    'use strict';

    var inject = ['$scope'];
    function StartController($scope) {
        var vm = this;

        // Bind to the scope
        angular.extend(vm, {
            title: 'Start page',
            test1: '',
            test2: '',
            users: [
                {
                    username: 'todi',
                    image: 'http://placekitten.com/g/50/50'
                }, {
                    username: 'jodi',
                    image: 'http://placekitten.com/g/51/51'
                }, {
                    username: 'lodi',
                    image: 'http://placekitten.com/g/52/52'
                }, {
                    username: 'tami',
                    image: 'http://placekitten.com/g/53/53'
                }, {
                    username: 'sami',
                    image: 'http://placekitten.com/g/54/54'
                }, {
                    username: 'jami',
                    image: 'http://placekitten.com/g/55/55'
                }, {
                    username: 'lami',
                    image: 'http://placekitten.com/g/56/56'
                }
            ]
        });
        angular.extend(vm, {
            textareaUsers: vm.users,
            inputUsers: vm.users
        })
    }
    
    // Start component
    StartController.$inject = inject;

    angular
        .module('controller.start', [])
        .controller('StartController', StartController);
})();


(function() {
    'use strict';


    angular
        .module('directive.mention', [])
        .directive('mention', [function(){
        // Runs during compile
        return {
            restrict: 'E',
            templateUrl: 'partials/mention.html',
            scope: {
                content: '=',
                list: '='
            },
            link: function($scope, element, attrs, ctrl) {
                
            }
        };
    }]);

})();