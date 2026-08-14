import HorizontalServiceSpine from './HorizontalServiceSpine';
import VerticalServiceSpine from './VerticalServiceSpine';
import { getSpineModel } from '../../utils/repairStage';

// The service spine - the one component pages use.
//
//   <ServiceSpine request={request} />
//   <ServiceSpine request={request} orientation="vertical" detailsByKey={...} />
//   <ServiceSpine model={model} />            // when the model is already resolved
//
// Pass a repair request and it resolves the stage model itself, so no page has
// to know a status string exists. Pass an already-resolved `model` instead when
// a screen has one to hand (a list that mapped its rows once, or a static
// marketing example) and the extra work is pointless.
//
// A `request` may also be a bare status string; utils/repairStage.js accepts
// that and every malformed value, and always returns a complete model - so
// this component cannot be handed something that makes it throw.
const ServiceSpine = ({ request, model, orientation = 'horizontal', detailsByKey, className }) => {
    const resolved = model || getSpineModel(request);
    const Spine = orientation === 'vertical' ? VerticalServiceSpine : HorizontalServiceSpine;

    return <Spine model={resolved} detailsByKey={detailsByKey} className={className} />;
};

export default ServiceSpine;
