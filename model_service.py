from lib.inference_lib import load_model_and_generator, get_results
import json
from model_item import ModelItem
from punctuate.punctuate_text import Punctuation
from inverse_text_normalization.run_predict import inverse_normalize_text
from srt.subtitle_generator import get_srt
from srt.infer import response_alignment

class ModelService:

    def __init__(self, model_config, decoder_type, cuda, half):
        self.model_items = {}
        self.cuda = cuda
        self.half = half
        for language_code, path in model_config.items():
            path_split = path.split("/")
            base_path = "/".join(path_split[:-1])
            model_file_name = path_split[-1]
            model_item = ModelItem(base_path, model_file_name, language_code)

            model, generator = load_model_and_generator(model_item, self.cuda, decoder = decoder_type, half = self.half)

            if language_code == 'en-IN':
                model_item.set_punctuation_model(Punctuation('en'))
            elif language_code == 'hi':
                model_item.set_punctuation_model(Punctuation(language_code))

            model_item.set_model(model)
            model_item.set_generator(generator)
            self.model_items[language_code] = model_item

    def apply_punctuation_and_itn(self, result, model_item, enable_punctuation, enable_inverse_text_normalization):
        language_code = model_item.get_language_code()
        if enable_inverse_text_normalization:
            language_code = 'en' if language_code == 'en-IN' else language_code
            itn_response = inverse_normalize_text([result],lang=language_code)
            result = itn_response[0]
        if enable_punctuation:
            punctuation_response = model_item.get_puncutation_model().punctuate_text([result])
            result = punctuation_response[0]
        
        return result

    def get_inference(self, file_name, language_code, enable_punctuation = False, enable_inverse_text_normalization = False):
        model_item = self.model_items[language_code]

        result = get_results(
            wav_path = file_name,
            dict_path = model_item.get_dict_file_path(),
            generator = model_item.get_generator(),
            use_cuda = self.cuda,
            model = model_item.get_model(),
            half = self.half
        )

        result = self.apply_punctuation_and_itn(result, model_item, enable_punctuation, enable_inverse_text_normalization)
        response = {}
        response['transcription'] = result
        response['status'] = 'OK'
        return response 

    def get_srt(self, file_name, language_code, enable_punctuation = False, enable_inverse_text_normalization = False):
        model_item = self.model_items[language_code]
        model = model_item.get_model()
        generator = model_item.get_generator()

        dict_file_path = model_item.get_dict_file_path()
        lm_path = model_item.get_language_model_path()
        result_arr = get_srt(file_name, model, generator, dict_file_path, '/home/nireshkumarr/inference-wrapper/denoiser', audio_threshold= 15, language = language_code, half = self.half)
        srt_string = ''
        for result in result_arr:
            res = result[0]
            if result[3]:
                resp = self.apply_punctuation_and_itn(result[1], model_item, enable_punctuation, enable_inverse_text_normalization)
                aligned_response = response_alignment(resp, num_words_per_line=25)
                res+='\n'.join(aligned_response)
            else:
                res+=result[1]
            res+= result[2]
            srt_string += res
        return srt_string
         
    def punctuate(self, text_to_punctuate, language_code, enable_inverse_text_normalization = False):
        model_item = self.model_items[language_code]
        result = self.apply_punctuation_and_itn(text_to_punctuate, model_item, True, enable_inverse_text_normalization)
        return result
        

if __name__ == "__main__":
    from lib.inference_lib import Wav2VecCtc
    with open('model_config.json','r') as f:
        model_config = json.load(f)
    model_service = ModelService(model_config, 'kenlm', True, True)
    


    # result = model_service.get_inference("/home/nireshkumarr/inference-wrapper/files/indian_english/file1.wav", 'en-IN', True, True)
    # result = model_service.get_srt("/home/nireshkumarr/inference-wrapper/files/indian_english/file1.wav", 'en-IN', True, True)
    
    result = model_service.get_inference("/home/nireshkumarr/inference-wrapper/files/hindi/chunk_04.wav", 'hi', True, True)
    # result = model_service.get_srt("/home/nireshkumarr/inference-wrapper/files/hindi/file1.wav", 'hi', True, True)

    
    print(result)