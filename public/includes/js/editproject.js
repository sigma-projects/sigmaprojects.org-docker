$(function () {

	var createImageUploader = function(jElm){
		new qq.FileUploader({
			element: jElm,
			action: '/admin/images/upload',
			params: { projectid: $(jElm).data('projectid') },
			allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'tiff'],
			onComplete: showUploadedImage,
			multiple: true,
			debug: false,
			template: '<div class="qq-uploader"><div class="qq-upload-drop-area" style="display:none"><span>Drop files here</span></div><div class="qq-upload-button btn btn-outline-secondary btn-sm">Select Images</div><ul class="qq-upload-list mt-2"></ul></div>'
		});
	};

	var showUploadedImage = function(id, fileName, objResponse){
		var objSelf = this;
		if(objResponse.success) {
			var inputElm = $('input[name="imageids"]');
			inputElm.val( inputElm.val() + ',' + objResponse.id );
			var ol = $('#editprojectimages');
			var li = $('<li></li>');
			li.attr('id',objResponse.id);
			li.data('id',objResponse.id);
			var img = $('<img width="80" height="80" class="img-responsive img-thumbnail" />');
			var src = '/index.cfm/image/small/' + objResponse.id;
			img.prop('src',src);
			li.append(img);
			ol.append(li);
		}
	};

	if( $('#uploadimages').length ) {
		createImageUploader( $('#uploadimages')[0] );
	};

	$('#editprojectimages').on('click', 'li',
		function( objEvent ) {
			var $this = $(this);
			var r = confirm('Are you sure you want to delete this image?');
			if(r) {
				$.post(
					'/admin/images/delete',
					{id:$this.data('id')},
					function( objResponse ){
						console.log(objResponse);
						$this.remove();
					},
					"json"
				);
			}
			return( false );
		}
	);



	var createFileUploader = function(jElm){
		new qq.FileUploader({
			element: jElm,
			action: '/admin/files/upload',
			params: { projectid: $(jElm).data('projectid') },
			onComplete: showUploadedFile,
			multiple: true,
			debug: false,
			template: '<div class="qq-uploader"><div class="qq-upload-drop-area" style="display:none"><span>Drop files here</span></div><div class="qq-upload-button btn btn-outline-secondary btn-sm">Select Files</div><ul class="qq-upload-list mt-2"></ul></div>'
		});
	};

	var showUploadedFile = function(id, fileName, objResponse){
		var objSelf = this;
		if(objResponse.success) {
			var inputElm = $('input[name="fileids"]');
			inputElm.val( inputElm.val() + ',' + objResponse.id );
			var ol = $('#editprojectfiles');
			var li = $('<li class="list-group-item"></li>');
			li.data('id',objResponse.id);
			li.text( objResponse.label );
			ol.append(li);
		}
	};

	if ($('#uploadfiles').length) {
		createFileUploader($('#uploadfiles')[0]);
	};

	$('#editprojectfiles').on('click', 'li',
		function( objEvent ) {
			var $this = $(this);
			var r = confirm('Are you sure you want to delete this file?');
			if(r) {
				$.post(
					'/admin/files/delete',
					{id:$this.data('id')},
					function( objResponse ){
						console.log(objResponse);
						$this.remove();
					},
					"json"
				);
			}
			return( false );
		}
	);

	// WYSIWYG editors using Quill
	var Font = Quill.import('attributors/class/font');
	Font.whitelist = ['arial', 'georgia', 'courier-new', 'verdana', 'tahoma', 'impact'];
	Quill.register(Font, true);

	var quillToolbar = [
		[{ 'font': [false, 'arial', 'georgia', 'courier-new', 'verdana', 'tahoma', 'impact'] }, { 'size': ['small', false, 'large', 'huge'] }],
		['bold', 'italic', 'underline'],
		[{ 'list': 'ordered' }, { 'list': 'bullet' }],
		['link', 'video'], ['clean']
	];

	var longDescEditor = null;
	if ($('#longdescription').length) {
		var $taLong = $('#longdescription');
		$('<div id="longdescription-editor"></div>').insertAfter($taLong);
		$taLong.hide();
		longDescEditor = new Quill('#longdescription-editor', {
			theme: 'snow',
			modules: { toolbar: quillToolbar }
		});
		longDescEditor.clipboard.dangerouslyPasteHTML($taLong.val() || '');
	}

	var updateDescEditor = null;
	if ($('#update_description').length) {
		var $taUpdate = $('#update_description');
		$('<div id="update_description-editor"></div>').insertAfter($taUpdate);
		$taUpdate.hide();
		updateDescEditor = new Quill('#update_description-editor', {
			theme: 'snow',
			modules: { toolbar: quillToolbar }
		});
	}

	$('form[action="/admin/projects/updates/save"]').on('submit', function() {
		if (updateDescEditor) $('#update_description').val(updateDescEditor.getSemanticHTML());
		return true;
	});

	$('#saveProjectForm').on('submit',
		function( objEvent ) {
			if (longDescEditor) $("textarea[name='longdescription']").val(longDescEditor.getSemanticHTML());
			var imageIds = $( "#editprojectimages" ).sortable('toArray').toString();
			$("input[name='imageids']").val(imageIds);
			return( true );
		}
	);

	$( "#editprojectimages" ).sortable();

});
