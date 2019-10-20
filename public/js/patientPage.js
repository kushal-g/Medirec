let numberOfSubHeadings = 0;
let template;
$('.newSubHeadingButton').click(e=>{
    numberOfSubHeadings++;
    template = `<input type="text" class="form-control mt-2" placeholder="Sub Heading ${numberOfSubHeadings+1}" name="newEntry[${numberOfSubHeadings}][subHeading]"required>
<textarea class="form-control mt-2" placeholder="Content" rows="5" name="newEntry[${numberOfSubHeadings}][content]" required></textarea>
<div class="form-group">
    <label for="attachedFiles">Attach Files (if any) :</label>
    <input type="file" class="form-control-file btn btn-outline-dark" id="attachedFiles">
</div>`;
    $('.formFields').append(template);
})